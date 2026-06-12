import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { app } from 'electron';
import path from 'path';
import { Device } from './entities/Device';
import { DeviceStatus } from './entities/DeviceStatus';
import { MaintenancePlan } from './entities/MaintenancePlan';
import { RawMaterial } from './entities/RawMaterial';
import { ProductionSchedule } from './entities/ProductionSchedule';
import { ScheduleApproval } from './entities/ScheduleApproval';
import { MonitoringData } from './entities/MonitoringData';
import { Alarm } from './entities/Alarm';
import { MaintenanceWorkOrder } from './entities/MaintenanceWorkOrder';
import { SparePart } from './entities/SparePart';
import { Employee } from './entities/Employee';
import { Shift } from './entities/Shift';
import { ShiftChange } from './entities/ShiftChange';
import { ProcessTransition } from './entities/ProcessTransition';

let dataSource: DataSource;

export function setupDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'refinery.db');
  
  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: dbPath,
    entities: [
      Device,
      DeviceStatus,
      MaintenancePlan,
      RawMaterial,
      ProductionSchedule,
      ScheduleApproval,
      MonitoringData,
      Alarm,
      MaintenanceWorkOrder,
      SparePart,
      Employee,
      Shift,
      ShiftChange,
      ProcessTransition
    ],
    synchronize: true,
    logging: false
  });

  dataSource.initialize().then(() => {
    console.log('数据库初始化成功');
    seedInitialData();
  }).catch((err) => {
    console.error('数据库初始化失败:', err);
  });
}

export function getDatabase(): DataSource {
  return dataSource;
}

async function seedInitialData() {
  const deviceRepo = dataSource.getRepository(Device);
  const deviceCount = await deviceRepo.count();
  if (deviceCount === 0) {
    const devices = [
      { code: 'CDU-001', name: '常压蒸馏装置1号', type: 'atmospheric', status: 'running', designCapacity: 500, temperatureMin: 300, temperatureMax: 380, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力500万吨的常压蒸馏装置' },
      { code: 'CDU-002', name: '常压蒸馏装置2号', type: 'atmospheric', status: 'maintenance', designCapacity: 300, temperatureMin: 300, temperatureMax: 380, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力300万吨的常压蒸馏装置' },
      { code: 'FCC-001', name: '催化裂化装置1号', type: 'catalytic_cracking', status: 'running', designCapacity: 200, temperatureMin: 480, temperatureMax: 530, pressureMin: 0.2, pressureMax: 0.4, description: '年处理能力200万吨的催化裂化装置' },
      { code: 'FCC-002', name: '催化裂化装置2号', type: 'catalytic_cracking', status: 'idle', designCapacity: 150, temperatureMin: 480, temperatureMax: 530, pressureMin: 0.2, pressureMax: 0.4, description: '年处理能力150万吨的催化裂化装置' },
      { code: 'HDT-001', name: '加氢裂化装置1号', type: 'hydrocracking', status: 'running', designCapacity: 180, temperatureMin: 380, temperatureMax: 420, pressureMin: 10, pressureMax: 16, description: '年处理能力180万吨的加氢裂化装置' },
      { code: 'HDT-002', name: '加氢精制装置1号', type: 'hydrotreating', status: 'running', designCapacity: 120, temperatureMin: 320, temperatureMax: 380, pressureMin: 5, pressureMax: 8, description: '年处理能力120万吨的加氢精制装置' },
      { code: 'VR-001', name: '减压蒸馏装置1号', type: 'vacuum_distillation', status: 'running', designCapacity: 400, temperatureMin: 380, temperatureMax: 420, pressureMin: 0.001, pressureMax: 0.01, description: '年处理能力400万吨的减压蒸馏装置' },
      { code: 'DEL-001', name: '延迟焦化装置1号', type: 'delayed_coking', status: 'idle', designCapacity: 100, temperatureMin: 480, temperatureMax: 510, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力100万吨的延迟焦化装置' }
    ];
    await deviceRepo.save(devices);
    console.log('已初始化装置数据');
  }

  const transitionRepo = dataSource.getRepository(ProcessTransition);
  const transitionCount = await transitionRepo.count();
  if (transitionCount === 0) {
    const transitions = [
      { fromType: 'atmospheric', toType: 'catalytic_cracking', transitionHours: 4, description: '常压切换催化需清塔4小时' },
      { fromType: 'atmospheric', toType: 'hydrocracking', transitionHours: 6, description: '常压切换加氢需清洗6小时' },
      { fromType: 'catalytic_cracking', toType: 'atmospheric', transitionHours: 5, description: '催化切换常压需降温吹扫5小时' },
      { fromType: 'catalytic_cracking', toType: 'hydrocracking', transitionHours: 8, description: '催化切换加氢需深度清洁8小时' },
      { fromType: 'hydrocracking', toType: 'atmospheric', transitionHours: 6, description: '加氢切换常压需泄压降温6小时' },
      { fromType: 'vacuum_distillation', toType: 'delayed_coking', transitionHours: 3, description: '减压切换焦化需3小时' },
      { fromType: 'hydrotreating', toType: 'hydrocracking', transitionHours: 4, description: '精制切换裂化需4小时' }
    ];
    await transitionRepo.save(transitions);
    console.log('已初始化工艺切换数据');
  }

  const materialRepo = dataSource.getRepository(RawMaterial);
  const materialCount = await materialRepo.count();
  if (materialCount === 0) {
    const materials = [
      { code: 'CRUDE-001', name: '沙特轻质原油', type: 'crude_oil', stock: 85000, unit: '吨', safetyStock: 30000, supplier: '沙特阿美' },
      { code: 'CRUDE-002', name: '俄罗斯乌拉尔原油', type: 'crude_oil', stock: 62000, unit: '吨', safetyStock: 25000, supplier: '俄罗斯石油' },
      { code: 'VGO-001', name: '减压蜡油', type: 'intermediate', stock: 15000, unit: '吨', safetyStock: 5000, supplier: '自产' },
      { code: 'AR-001', name: '常压渣油', type: 'intermediate', stock: 22000, unit: '吨', safetyStock: 8000, supplier: '自产' },
      { code: 'H2-001', name: '氢气', type: 'utility', stock: 500000, unit: 'Nm³', safetyStock: 200000, supplier: '制氢装置' }
    ];
    await materialRepo.save(materials);
    console.log('已初始化原料数据');
  }

  const employeeRepo = dataSource.getRepository(Employee);
  const employeeCount = await employeeRepo.count();
  if (employeeCount === 0) {
    const employees = [
      { code: 'EMP001', name: '张建国', position: '生产主管', department: '生产部', skills: JSON.stringify(['atmospheric', 'catalytic_cracking', 'scheduling']), maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP002', name: '李志强', position: '中控操作员', department: '生产部', skills: JSON.stringify(['atmospheric', 'control_room']), maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP003', name: '王海峰', position: '中控操作员', department: '生产部', skills: JSON.stringify(['catalytic_cracking', 'control_room']), maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP004', name: '赵明辉', position: '设备工程师', department: '设备部', skills: JSON.stringify(['maintenance', 'mechanical']), maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP005', name: '孙伟', position: '维修班长', department: '设备部', skills: JSON.stringify(['maintenance', 'piping', 'valves']), maxWorkHoursPerWeek: 50, status: 'active' },
      { code: 'EMP006', name: '周涛', position: '维修技工', department: '设备部', skills: JSON.stringify(['maintenance', 'pumps']), maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP007', name: '吴斌', position: '维修技工', department: '设备部', skills: JSON.stringify(['maintenance', 'instrument']), maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP008', name: '郑雷', position: '安全工程师', department: '安全部', skills: JSON.stringify(['safety', 'monitoring']), maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP009', name: '陈刚', position: '中控操作员', department: '生产部', skills: JSON.stringify(['hydrocracking', 'control_room']), maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP010', name: '刘华', position: '化验分析师', department: '质量部', skills: JSON.stringify(['laboratory', 'analysis']), maxWorkHoursPerWeek: 40, status: 'active' }
    ];
    await employeeRepo.save(employees);
    console.log('已初始化员工数据');
  }

  const partRepo = dataSource.getRepository(SparePart);
  const defaultParts = [
    { code: 'SP-001', name: '高温油泵密封件', type: 'seal', stock: 25, unit: '套', safetyStock: 10, location: 'A-01-03', price: 2500 },
    { code: 'SP-002', name: '压力容器安全阀', type: 'valve', stock: 15, unit: '个', safetyStock: 5, location: 'B-02-01', price: 8500 },
    { code: 'SP-003', name: '温度变送器PT100', type: 'instrument', stock: 40, unit: '支', safetyStock: 20, location: 'C-01-05', price: 1200 },
    { code: 'SP-004', name: '压力传感器', type: 'instrument', stock: 30, unit: '个', safetyStock: 15, location: 'C-02-02', price: 3200 },
    { code: 'SP-005', name: '换热器管束', type: 'heat_exchanger', stock: 3, unit: '组', safetyStock: 2, location: 'D-01-01', price: 120000 },
    { code: 'SP-006', name: '催化剂', type: 'catalyst', stock: 8000, unit: 'kg', safetyStock: 3000, location: 'E-01-01', price: 150 },
    { code: 'SP-007', name: '防腐蚀涂料', type: 'coating', stock: 150, unit: '桶', safetyStock: 50, location: 'F-01-03', price: 800 },
    { code: 'SP-008', name: '液压油46号', type: 'lubricant', stock: 200, unit: 'L', safetyStock: 80, location: 'G-02-01', price: 35 }
  ];
  let partAdded = 0;
  for (const p of defaultParts) {
    const existing = await partRepo.findOne({ where: { code: p.code } });
    if (!existing) {
      await partRepo.save(p);
      partAdded++;
    }
  }
  if (partAdded > 0) {
    console.log(`已补齐 ${partAdded} 条备件数据`);
  }

  const statusRepo = dataSource.getRepository(DeviceStatus);
  const statusCount = await statusRepo.count();
  if (statusCount === 0) {
    const deviceStatuses = [
      { deviceCode: 'CDU-001', temperature: 365, pressure: 0.25, level: 65, flowRate: 520, currentOutput: 480, runHours: 1850, healthStatus: 'normal' },
      { deviceCode: 'CDU-002', temperature: 0, pressure: 0, level: 0, flowRate: 0, currentOutput: 0, runHours: 3200, healthStatus: 'maintenance' },
      { deviceCode: 'FCC-001', temperature: 505, pressure: 0.32, level: 72, flowRate: 210, currentOutput: 195, runHours: 2680, healthStatus: 'warning' },
      { deviceCode: 'FCC-002', temperature: 0, pressure: 0, level: 0, flowRate: 0, currentOutput: 0, runHours: 1500, healthStatus: 'idle' },
      { deviceCode: 'HDT-001', temperature: 405, pressure: 13.5, level: 58, flowRate: 185, currentOutput: 170, runHours: 3100, healthStatus: 'normal' },
      { deviceCode: 'HDT-002', temperature: 355, pressure: 6.8, level: 70, flowRate: 125, currentOutput: 115, runHours: 2200, healthStatus: 'normal' },
      { deviceCode: 'VR-001', temperature: 400, pressure: 0.005, level: 62, flowRate: 410, currentOutput: 380, runHours: 1950, healthStatus: 'normal' },
      { deviceCode: 'DEL-001', temperature: 0, pressure: 0, level: 0, flowRate: 0, currentOutput: 0, runHours: 2800, healthStatus: 'idle' }
    ];
    await statusRepo.save(deviceStatuses);
    console.log('已初始化装置状态数据');
  }

  const orderRepo = dataSource.getRepository(MaintenanceWorkOrder);
  const defaultOrders = [
    {
      orderNumber: 'WO-20240610-001',
      deviceCode: 'CDU-001',
      workType: '预防性维护',
      description: '常压蒸馏装置1号例行巡检及密封件检查更换',
      spareParts: JSON.stringify([{ code: 'SP-001', quantity: 2, name: '高温油泵密封件' }]),
      priority: 'medium',
      status: 'completed',
      assignedTeam: '维修一班',
      assignee: '孙伟',
      plannedDate: '2024-06-08',
      completedDate: '2024-06-09',
      laborHours: 6,
      remarks: '常规预防性维护，已更换密封件2套'
    },
    {
      orderNumber: 'WO-20240611-002',
      deviceCode: 'FCC-001',
      workType: '故障维修',
      description: '催化裂化装置1号再生器料位偏高，检查料腿疏通',
      spareParts: JSON.stringify([{ code: 'SP-003', quantity: 3, name: '温度变送器PT100' }]),
      priority: 'high',
      status: 'in_progress',
      assignedTeam: '维修一班',
      assignee: '王海峰',
      plannedDate: '2024-06-11',
      laborHours: 8
    },
    {
      orderNumber: 'WO-20240612-003',
      deviceCode: 'HDT-001',
      workType: '预防性维护',
      description: '加氢裂化装置1号高压换热器定期检测',
      spareParts: JSON.stringify([{ code: 'SP-004', quantity: 2, name: '压力传感器' }, { code: 'SP-005', quantity: 1, name: '换热器管束' }]),
      priority: 'medium',
      status: 'pending',
      plannedDate: '2024-06-15',
      laborHours: 12
    },
    {
      orderNumber: 'WO-20240612-004',
      deviceCode: 'VR-001',
      workType: '检查',
      description: '减压蒸馏装置1号炉管壁厚检测',
      spareParts: '',
      priority: 'low',
      status: 'pending',
      plannedDate: '2024-06-18',
      laborHours: 4
    },
    {
      orderNumber: 'WO-20240609-005',
      deviceCode: 'CDU-002',
      workType: '大修',
      description: '常压蒸馏装置2号年度大修，全面检查更换',
      spareParts: JSON.stringify([{ code: 'SP-001', quantity: 4, name: '高温油泵密封件' }, { code: 'SP-002', quantity: 2, name: '压力容器安全阀' }, { code: 'SP-006', quantity: 500, name: '催化剂' }]),
      priority: 'high',
      status: 'in_progress',
      assignedTeam: '维修二班',
      assignee: '赵明辉',
      plannedDate: '2024-06-05',
      laborHours: 40
    }
  ];
  let orderAdded = 0;
  for (const o of defaultOrders) {
    const existing = await orderRepo.findOne({ where: { orderNumber: o.orderNumber } });
    if (!existing) {
      await orderRepo.save(o);
      orderAdded++;
    }
  }
  if (orderAdded > 0) {
    console.log(`已补齐 ${orderAdded} 条维保工单数据`);
  }

  const alarmRepo = dataSource.getRepository(Alarm);
  const alarmCount = await alarmRepo.count();
  if (alarmCount === 0) {
    const alarms = [
      {
        deviceCode: 'HDT-001',
        alarmCode: 'ALM-202406120930-001',
        alarmLevel: 'warning',
        parameter: '反应温度',
        parameterKey: 'temperature',
        thresholdValue: '420°C',
        actualValue: 423.5,
        status: 'active',
        message: '加氢裂化1号反应温度偏高，请检查加热炉燃料流量'
      },
      {
        deviceCode: 'FCC-001',
        alarmCode: 'ALM-202406120945-002',
        alarmLevel: 'info',
        parameter: '塔顶压力',
        parameterKey: 'pressure',
        thresholdValue: '0.3MPa',
        actualValue: 0.28,
        status: 'acknowledged',
        message: '催化裂化1号塔顶压力略低于正常值',
        acknowledgedBy: '李志强',
        acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
        actionTaken: '已调整回流量'
      },
      {
        deviceCode: 'VR-001',
        alarmCode: 'ALM-202406121015-003',
        alarmLevel: 'warning',
        parameter: '再生器料位',
        parameterKey: 'level',
        thresholdValue: '80%',
        actualValue: 82.3,
        status: 'active',
        message: '减压蒸馏1号塔底液位偏高'
      }
    ];
    await alarmRepo.save(alarms);
    console.log('已初始化报警数据');
  }

  console.log('数据库初始化检查完成');
}
