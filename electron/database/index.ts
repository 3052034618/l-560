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
  const count = await deviceRepo.count();
  if (count === 0) {
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

    const transitionRepo = dataSource.getRepository(ProcessTransition);
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

    const materialRepo = dataSource.getRepository(RawMaterial);
    const materials = [
      { code: 'CRUDE-001', name: '沙特轻质原油', type: 'crude_oil', stock: 85000, unit: '吨', safetyStock: 30000, supplier: '沙特阿美' },
      { code: 'CRUDE-002', name: '俄罗斯乌拉尔原油', type: 'crude_oil', stock: 62000, unit: '吨', safetyStock: 25000, supplier: '俄罗斯石油' },
      { code: 'VGO-001', name: '减压蜡油', type: 'intermediate', stock: 15000, unit: '吨', safetyStock: 5000, supplier: '自产' },
      { code: 'AR-001', name: '常压渣油', type: 'intermediate', stock: 22000, unit: '吨', safetyStock: 8000, supplier: '自产' },
      { code: 'H2-001', name: '氢气', type: 'utility', stock: 500000, unit: 'Nm³', safetyStock: 200000, supplier: '制氢装置' }
    ];
    await materialRepo.save(materials);

    const employeeRepo = dataSource.getRepository(Employee);
    const employees = [
      { code: 'EMP001', name: '张建国', position: '生产主管', department: '生产部', skills: ['atmospheric', 'catalytic_cracking', 'scheduling'], maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP002', name: '李志强', position: '中控操作员', department: '生产部', skills: ['atmospheric', 'control_room'], maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP003', name: '王海峰', position: '中控操作员', department: '生产部', skills: ['catalytic_cracking', 'control_room'], maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP004', name: '赵明辉', position: '设备工程师', department: '设备部', skills: ['maintenance', 'mechanical'], maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP005', name: '孙伟', position: '维修班长', department: '设备部', skills: ['maintenance', 'piping', 'valves'], maxWorkHoursPerWeek: 50, status: 'active' },
      { code: 'EMP006', name: '周涛', position: '维修技工', department: '设备部', skills: ['maintenance', 'pumps'], maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP007', name: '吴斌', position: '维修技工', department: '设备部', skills: ['maintenance', 'instrument'], maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP008', name: '郑雷', position: '安全工程师', department: '安全部', skills: ['safety', 'monitoring'], maxWorkHoursPerWeek: 48, status: 'active' },
      { code: 'EMP009', name: '陈刚', position: '中控操作员', department: '生产部', skills: ['hydrocracking', 'control_room'], maxWorkHoursPerWeek: 44, status: 'active' },
      { code: 'EMP010', name: '刘华', position: '化验分析师', department: '质量部', skills: ['laboratory', 'analysis'], maxWorkHoursPerWeek: 40, status: 'active' }
    ];
    await employeeRepo.save(employees);

    const partRepo = dataSource.getRepository(SparePart);
    const parts = [
      { code: 'SP-001', name: '高温油泵密封件', type: 'seal', stock: 25, unit: '套', safetyStock: 10, location: 'A-01-03', price: 2500 },
      { code: 'SP-002', name: '压力容器安全阀', type: 'valve', stock: 15, unit: '个', safetyStock: 5, location: 'B-02-01', price: 8500 },
      { code: 'SP-003', name: '温度变送器PT100', type: 'instrument', stock: 40, unit: '支', safetyStock: 20, location: 'C-01-05', price: 1200 },
      { code: 'SP-004', name: '压力传感器', type: 'instrument', stock: 30, unit: '个', safetyStock: 15, location: 'C-02-02', price: 3200 },
      { code: 'SP-005', name: '换热器管束', type: 'heat_exchanger', stock: 3, unit: '组', safetyStock: 2, location: 'D-01-01', price: 120000 },
      { code: 'SP-006', name: '催化剂', type: 'catalyst', stock: 8000, unit: 'kg', safetyStock: 3000, location: 'E-01-01', price: 150 },
      { code: 'SP-007', name: '防腐蚀涂料', type: 'coating', stock: 150, unit: '桶', safetyStock: 50, location: 'F-01-03', price: 800 },
      { code: 'SP-008', name: '液压油46号', type: 'lubricant', stock: 200, unit: 'L', safetyStock: 80, location: 'G-02-01', price: 35 }
    ];
    await partRepo.save(parts);

    console.log('初始化数据已加载');
  }
}
