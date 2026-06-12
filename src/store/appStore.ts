import { create } from 'zustand';

export interface Device {
  id?: number;
  code: string;
  name: string;
  type: string;
  status: string;
  designCapacity: number;
  temperatureMin: number;
  temperatureMax: number;
  pressureMin: number;
  pressureMax: number;
  description?: string;
}

export interface DeviceStatus {
  id?: number;
  deviceCode: string;
  temperature: number;
  pressure: number;
  level: number;
  flowRate: number;
  currentOutput: number;
  runHours: number;
  healthStatus: string;
  timestamp?: string;
}

export interface RawMaterial {
  id?: number;
  code: string;
  name: string;
  type: string;
  stock: number;
  unit: string;
  safetyStock: number;
  supplier: string;
}

export interface ProductionScheduleItem {
  id?: number;
  scheduleDate: string;
  shift: string;
  deviceCode: string;
  product: string;
  plannedOutput: number;
  actualOutput: number;
  startTime: string;
  endTime: string;
  rawMaterials?: string;
  status: string;
  notes?: string;
}

export interface Alarm {
  id?: number;
  deviceCode: string;
  parameter: string;
  alarmLevel: string;
  thresholdValue: number;
  actualValue: string;
  status: string;
  message: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  actionTaken?: string;
  createdAt?: string;
}

export interface MaintenanceWorkOrder {
  id?: number;
  orderNumber: string;
  deviceCode: string;
  workType: string;
  description: string;
  spareParts?: string;
  priority: string;
  status: string;
  assignedTeam?: string;
  assignee?: string;
  plannedDate?: string;
  completedDate?: string;
  laborHours: number;
  remarks?: string;
}

export interface SparePart {
  id?: number;
  code: string;
  name: string;
  type: string;
  stock: number;
  unit: string;
  safetyStock: number;
  location: string;
  price: number;
}

export interface Employee {
  id?: number;
  code: string;
  name: string;
  position: string;
  department: string;
  skills: string;
  maxWorkHoursPerWeek: number;
  status: string;
}

export interface ShiftItem {
  id?: number;
  shiftDate: string;
  shiftType: string;
  employeeCode: string;
  deviceCode: string;
  startTime: string;
  endTime: string;
  tasks?: string;
}

export interface ProcessTransition {
  id?: number;
  fromType: string;
  toType: string;
  transitionHours: number;
  description: string;
}

interface AppState {
  devices: Device[];
  deviceStatuses: DeviceStatus[];
  rawMaterials: RawMaterial[];
  schedules: ProductionScheduleItem[];
  alarms: Alarm[];
  workOrders: MaintenanceWorkOrder[];
  spareParts: SparePart[];
  employees: Employee[];
  shifts: ShiftItem[];
  transitions: ProcessTransition[];
  loading: boolean;

  setLoading: (loading: boolean) => void;
  loadDevices: () => Promise<void>;
  loadDeviceStatuses: () => Promise<void>;
  loadRawMaterials: () => Promise<void>;
  loadSchedules: () => Promise<void>;
  loadAlarms: () => Promise<void>;
  loadWorkOrders: () => Promise<void>;
  loadSpareParts: () => Promise<void>;
  loadEmployees: () => Promise<void>;
  loadShifts: () => Promise<void>;
  loadTransitions: () => Promise<void>;
  loadAll: () => Promise<void>;

  saveDevice: (device: Device) => Promise<any>;
  removeDevice: (id: number) => Promise<any>;
  saveSchedule: (schedule: ProductionScheduleItem) => Promise<any>;
  saveAlarm: (alarm: Alarm) => Promise<any>;
  saveWorkOrder: (order: MaintenanceWorkOrder) => Promise<any>;
  saveSparePart: (part: SparePart) => Promise<any>;
  saveEmployee: (emp: Employee) => Promise<any>;
  saveShift: (shift: ShiftItem) => Promise<any>;
}

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  deviceStatuses: [],
  rawMaterials: [],
  schedules: [],
  alarms: [],
  workOrders: [],
  spareParts: [],
  employees: [],
  shifts: [],
  transitions: [],
  loading: false,

  setLoading: (loading) => set({ loading }),

  loadDevices: async () => {
    if (!window.electronAPI) {
      set({ devices: getMockDevices() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('Device');
      set({ devices: data });
    } catch (e) {
      console.error('加载装置失败', e);
      set({ devices: getMockDevices() });
    }
  },

  loadDeviceStatuses: async () => {
    if (!window.electronAPI) {
      set({ deviceStatuses: getMockDeviceStatuses() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('DeviceStatus');
      set({ deviceStatuses: data.length ? data : getMockDeviceStatuses() });
    } catch (e) {
      console.error('加载装置状态失败', e);
      set({ deviceStatuses: getMockDeviceStatuses() });
    }
  },

  loadRawMaterials: async () => {
    if (!window.electronAPI) {
      set({ rawMaterials: getMockMaterials() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('RawMaterial');
      set({ rawMaterials: data });
    } catch (e) {
      console.error('加载原料失败', e);
      set({ rawMaterials: getMockMaterials() });
    }
  },

  loadSchedules: async () => {
    if (!window.electronAPI) {
      set({ schedules: getMockSchedules() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('ProductionSchedule');
      set({ schedules: data.length ? data : getMockSchedules() });
    } catch (e) {
      console.error('加载排产失败', e);
      set({ schedules: getMockSchedules() });
    }
  },

  loadAlarms: async () => {
    if (!window.electronAPI) {
      set({ alarms: getMockAlarms() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('Alarm');
      set({ alarms: data.length ? data : getMockAlarms() });
    } catch (e) {
      console.error('加载报警失败', e);
      set({ alarms: getMockAlarms() });
    }
  },

  loadWorkOrders: async () => {
    if (!window.electronAPI) {
      set({ workOrders: getMockWorkOrders() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('MaintenanceWorkOrder');
      set({ workOrders: data.length ? data : getMockWorkOrders() });
    } catch (e) {
      console.error('加载工单失败', e);
      set({ workOrders: getMockWorkOrders() });
    }
  },

  loadSpareParts: async () => {
    if (!window.electronAPI) {
      set({ spareParts: getMockSpareParts() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('SparePart');
      set({ spareParts: data });
    } catch (e) {
      console.error('加载备件失败', e);
      set({ spareParts: getMockSpareParts() });
    }
  },

  loadEmployees: async () => {
    if (!window.electronAPI) {
      set({ employees: getMockEmployees() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('Employee');
      set({ employees: data });
    } catch (e) {
      console.error('加载员工失败', e);
      set({ employees: getMockEmployees() });
    }
  },

  loadShifts: async () => {
    if (!window.electronAPI) {
      set({ shifts: getMockShifts() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('Shift');
      set({ schedules: data.length ? data : getMockShifts() });
    } catch (e) {
      console.error('加载排班失败', e);
      set({ shifts: getMockShifts() });
    }
  },

  loadTransitions: async () => {
    if (!window.electronAPI) {
      set({ transitions: getMockTransitions() });
      return;
    }
    try {
      const data = await window.electronAPI.db.find('ProcessTransition');
      set({ transitions: data });
    } catch (e) {
      console.error('加载工艺切换失败', e);
      set({ transitions: getMockTransitions() });
    }
  },

  loadAll: async () => {
    set({ loading: true });
    await Promise.all([
      get().loadDevices(),
      get().loadDeviceStatuses(),
      get().loadRawMaterials(),
      get().loadSchedules(),
      get().loadAlarms(),
      get().loadWorkOrders(),
      get().loadSpareParts(),
      get().loadEmployees(),
      get().loadShifts(),
      get().loadTransitions()
    ]);
    set({ loading: false });
  },

  saveDevice: async (device) => {
    if (!window.electronAPI) return device;
    return window.electronAPI.db.save('Device', device);
  },

  removeDevice: async (id) => {
    if (!window.electronAPI) return null;
    return window.electronAPI.db.remove('Device', id);
  },

  saveSchedule: async (schedule) => {
    if (!window.electronAPI) return schedule;
    return window.electronAPI.db.save('ProductionSchedule', schedule);
  },

  saveAlarm: async (alarm) => {
    if (!window.electronAPI) return alarm;
    return window.electronAPI.db.save('Alarm', alarm);
  },

  saveWorkOrder: async (order) => {
    if (!window.electronAPI) return order;
    return window.electronAPI.db.save('MaintenanceWorkOrder', order);
  },

  saveSparePart: async (part) => {
    if (!window.electronAPI) return part;
    return window.electronAPI.db.save('SparePart', part);
  },

  saveEmployee: async (emp) => {
    if (!window.electronAPI) return emp;
    return window.electronAPI.db.save('Employee', emp);
  },

  saveShift: async (shift) => {
    if (!window.electronAPI) return shift;
    return window.electronAPI.db.save('Shift', shift);
  }
}));

function getMockDevices(): Device[] {
  return [
    { id: 1, code: 'CDU-001', name: '常压蒸馏装置1号', type: 'atmospheric', status: 'running', designCapacity: 500, temperatureMin: 300, temperatureMax: 380, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力500万吨的常压蒸馏装置' },
    { id: 2, code: 'CDU-002', name: '常压蒸馏装置2号', type: 'atmospheric', status: 'maintenance', designCapacity: 300, temperatureMin: 300, temperatureMax: 380, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力300万吨的常压蒸馏装置' },
    { id: 3, code: 'FCC-001', name: '催化裂化装置1号', type: 'catalytic_cracking', status: 'running', designCapacity: 200, temperatureMin: 480, temperatureMax: 530, pressureMin: 0.2, pressureMax: 0.4, description: '年处理能力200万吨的催化裂化装置' },
    { id: 4, code: 'FCC-002', name: '催化裂化装置2号', type: 'catalytic_cracking', status: 'idle', designCapacity: 150, temperatureMin: 480, temperatureMax: 530, pressureMin: 0.2, pressureMax: 0.4, description: '年处理能力150万吨的催化裂化装置' },
    { id: 5, code: 'HDT-001', name: '加氢裂化装置1号', type: 'hydrocracking', status: 'running', designCapacity: 180, temperatureMin: 380, temperatureMax: 420, pressureMin: 10, pressureMax: 16, description: '年处理能力180万吨的加氢裂化装置' },
    { id: 6, code: 'HDT-002', name: '加氢精制装置1号', type: 'hydrotreating', status: 'running', designCapacity: 120, temperatureMin: 320, temperatureMax: 380, pressureMin: 5, pressureMax: 8, description: '年处理能力120万吨的加氢精制装置' },
    { id: 7, code: 'VR-001', name: '减压蒸馏装置1号', type: 'vacuum_distillation', status: 'running', designCapacity: 400, temperatureMin: 380, temperatureMax: 420, pressureMin: 0.001, pressureMax: 0.01, description: '年处理能力400万吨的减压蒸馏装置' },
    { id: 8, code: 'DEL-001', name: '延迟焦化装置1号', type: 'delayed_coking', status: 'idle', designCapacity: 100, temperatureMin: 480, temperatureMax: 510, pressureMin: 0.1, pressureMax: 0.3, description: '年处理能力100万吨的延迟焦化装置' }
  ];
}

function getMockDeviceStatuses(): DeviceStatus[] {
  return [
    { deviceCode: 'CDU-001', temperature: 352.5, pressure: 0.18, level: 68.5, flowRate: 620, currentOutput: 485, runHours: 2847, healthStatus: 'normal' },
    { deviceCode: 'CDU-002', temperature: 25, pressure: 0, level: 0, flowRate: 0, currentOutput: 0, runHours: 1892, healthStatus: 'maintenance' },
    { deviceCode: 'FCC-001', temperature: 505.2, pressure: 0.28, level: 72.3, flowRate: 245, currentOutput: 186, runHours: 3124, healthStatus: 'normal' },
    { deviceCode: 'FCC-002', temperature: 35, pressure: 0.1, level: 15.2, flowRate: 0, currentOutput: 0, runHours: 2456, healthStatus: 'idle' },
    { deviceCode: 'HDT-001', temperature: 402.8, pressure: 13.5, level: 65.8, flowRate: 195, currentOutput: 168, runHours: 2689, healthStatus: 'warning' },
    { deviceCode: 'HDT-002', temperature: 355.6, pressure: 6.8, level: 70.2, flowRate: 128, currentOutput: 112, runHours: 2156, healthStatus: 'normal' },
    { deviceCode: 'VR-001', temperature: 401.2, pressure: 0.005, level: 58.5, flowRate: 485, currentOutput: 378, runHours: 2934, healthStatus: 'normal' },
    { deviceCode: 'DEL-001', temperature: 28, pressure: 0.1, level: 8.5, flowRate: 0, currentOutput: 0, runHours: 1567, healthStatus: 'idle' }
  ];
}

function getMockMaterials(): RawMaterial[] {
  return [
    { id: 1, code: 'CRUDE-001', name: '沙特轻质原油', type: 'crude_oil', stock: 85000, unit: '吨', safetyStock: 30000, supplier: '沙特阿美' },
    { id: 2, code: 'CRUDE-002', name: '俄罗斯乌拉尔原油', type: 'crude_oil', stock: 62000, unit: '吨', safetyStock: 25000, supplier: '俄罗斯石油' },
    { id: 3, code: 'VGO-001', name: '减压蜡油', type: 'intermediate', stock: 15000, unit: '吨', safetyStock: 5000, supplier: '自产' },
    { id: 4, code: 'AR-001', name: '常压渣油', type: 'intermediate', stock: 22000, unit: '吨', safetyStock: 8000, supplier: '自产' },
    { id: 5, code: 'H2-001', name: '氢气', type: 'utility', stock: 500000, unit: 'Nm³', safetyStock: 200000, supplier: '制氢装置' }
  ];
}

function getMockSchedules(): ProductionScheduleItem[] {
  const today = new Date().toISOString().split('T')[0];
  return [
    { id: 1, scheduleDate: today, shift: '白班', deviceCode: 'CDU-001', product: '直馏汽油/柴油', plannedOutput: 18000, actualOutput: 17650, startTime: '08:00', endTime: '20:00', rawMaterials: 'CRUDE-001: 30000吨', status: 'approved', notes: '按计划运行' },
    { id: 2, scheduleDate: today, shift: '夜班', deviceCode: 'CDU-001', product: '直馏汽油/柴油', plannedOutput: 18000, actualOutput: 0, startTime: '20:00', endTime: '08:00', rawMaterials: 'CRUDE-001: 30000吨', status: 'approved', notes: '' },
    { id: 3, scheduleDate: today, shift: '白班', deviceCode: 'FCC-001', product: '催化汽油/LPG', plannedOutput: 7200, actualOutput: 7080, startTime: '08:00', endTime: '20:00', rawMaterials: 'VGO-001: 10000吨', status: 'approved', notes: '' },
    { id: 4, scheduleDate: today, shift: '白班', deviceCode: 'HDT-001', product: '加氢裂化柴油', plannedOutput: 6500, actualOutput: 6320, startTime: '08:00', endTime: '20:00', rawMaterials: 'VGO-001: 8000吨, H2-001: 200000Nm³', status: 'pending_approval', notes: '待审批' },
    { id: 5, scheduleDate: today, shift: '白班', deviceCode: 'HDT-002', product: '精制柴油', plannedOutput: 4200, actualOutput: 4150, startTime: '08:00', endTime: '20:00', rawMaterials: 'AR-001: 5000吨', status: 'approved', notes: '' },
    { id: 6, scheduleDate: today, shift: '白班', deviceCode: 'VR-001', product: '减压蜡油/渣油', plannedOutput: 14000, actualOutput: 13820, startTime: '08:00', endTime: '20:00', rawMaterials: 'CRUDE-002: 20000吨', status: 'approved', notes: '' }
  ];
}

function getMockAlarms(): Alarm[] {
  return [
    { id: 1, deviceCode: 'HDT-001', parameter: '反应温度', alarmLevel: 'warning', thresholdValue: 420, actualValue: '423.5', status: 'active', message: '加氢裂化1号反应温度偏高，请检查加热炉燃料流量', createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 2, deviceCode: 'CDU-001', parameter: '塔顶压力', alarmLevel: 'info', thresholdValue: 0.3, actualValue: '0.25', status: 'acknowledged', message: '常压1号塔顶压力略低于正常值', acknowledgedBy: '李志强', acknowledgedAt: new Date(Date.now() - 600000).toISOString(), actionTaken: '已调整回流比', createdAt: new Date(Date.now() - 900000).toISOString() },
    { id: 3, deviceCode: 'FCC-001', parameter: '再生器料位', alarmLevel: 'warning', thresholdValue: 80, actualValue: '82.3', status: 'active', message: '催化裂化1号再生器料位偏高', createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: 4, deviceCode: 'VR-001', parameter: '炉出口温度', alarmLevel: 'critical', thresholdValue: 420, actualValue: '425.8', status: 'active', message: '减压蒸馏1号炉出口温度超临界阈值！立即检查！', createdAt: new Date(Date.now() - 60000).toISOString() }
  ];
}

function getMockWorkOrders(): MaintenanceWorkOrder[] {
  return [
    { id: 1, orderNumber: 'WO-2024-0001', deviceCode: 'CDU-002', workType: '大修', description: '常压2号装置年度大修，包括塔内件检查更换、换热器清洗、安全阀校验', spareParts: 'SP-005: 1组, SP-002: 3个, SP-001: 8套', priority: 'high', status: 'in_progress', assignedTeam: '维修一班', assignee: '孙伟', plannedDate: new Date().toISOString().split('T')[0], laborHours: 120, remarks: '预计工期10天' },
    { id: 2, orderNumber: 'WO-2024-0002', deviceCode: 'FCC-001', workType: '预防性维护', description: '催化裂化1号装置主风机轴承检查润滑', spareParts: 'SP-008: 50L', priority: 'medium', status: 'pending', assignedTeam: '维修一班', plannedDate: new Date().toISOString().split('T')[0], laborHours: 8, remarks: '' },
    { id: 3, orderNumber: 'WO-2024-0003', deviceCode: 'HDT-001', workType: '故障维修', description: '加氢裂化1号装置高压分离器液位计故障，需更换变送器', spareParts: 'SP-004: 1个', priority: 'high', status: 'completed', assignedTeam: '维修二班', assignee: '吴斌', plannedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], completedDate: new Date().toISOString().split('T')[0], laborHours: 6, remarks: '已修复并调试正常' },
    { id: 4, orderNumber: 'WO-2024-0004', deviceCode: 'DEL-001', workType: '检查', description: '延迟焦化装置停工期间进行全面腐蚀检查', spareParts: '', priority: 'low', status: 'pending', plannedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], laborHours: 24, remarks: '' }
  ];
}

function getMockSpareParts(): SparePart[] {
  return [
    { id: 1, code: 'SP-001', name: '高温油泵密封件', type: 'seal', stock: 25, unit: '套', safetyStock: 10, location: 'A-01-03', price: 2500 },
    { id: 2, code: 'SP-002', name: '压力容器安全阀', type: 'valve', stock: 15, unit: '个', safetyStock: 5, location: 'B-02-01', price: 8500 },
    { id: 3, code: 'SP-003', name: '温度变送器PT100', type: 'instrument', stock: 40, unit: '支', safetyStock: 20, location: 'C-01-05', price: 1200 },
    { id: 4, code: 'SP-004', name: '压力传感器', type: 'instrument', stock: 30, unit: '个', safetyStock: 15, location: 'C-02-02', price: 3200 },
    { id: 5, code: 'SP-005', name: '换热器管束', type: 'heat_exchanger', stock: 3, unit: '组', safetyStock: 2, location: 'D-01-01', price: 120000 },
    { id: 6, code: 'SP-006', name: '催化剂', type: 'catalyst', stock: 8000, unit: 'kg', safetyStock: 3000, location: 'E-01-01', price: 150 },
    { id: 7, code: 'SP-007', name: '防腐蚀涂料', type: 'coating', stock: 150, unit: '桶', safetyStock: 50, location: 'F-01-03', price: 800 },
    { id: 8, code: 'SP-008', name: '液压油46号', type: 'lubricant', stock: 200, unit: 'L', safetyStock: 80, location: 'G-02-01', price: 35 }
  ];
}

function getMockEmployees(): Employee[] {
  return [
    { id: 1, code: 'EMP001', name: '张建国', position: '生产主管', department: '生产部', skills: '["atmospheric","catalytic_cracking","scheduling"]', maxWorkHoursPerWeek: 48, status: 'active' },
    { id: 2, code: 'EMP002', name: '李志强', position: '中控操作员', department: '生产部', skills: '["atmospheric","control_room"]', maxWorkHoursPerWeek: 44, status: 'active' },
    { id: 3, code: 'EMP003', name: '王海峰', position: '中控操作员', department: '生产部', skills: '["catalytic_cracking","control_room"]', maxWorkHoursPerWeek: 44, status: 'active' },
    { id: 4, code: 'EMP004', name: '赵明辉', position: '设备工程师', department: '设备部', skills: '["maintenance","mechanical"]', maxWorkHoursPerWeek: 48, status: 'active' },
    { id: 5, code: 'EMP005', name: '孙伟', position: '维修班长', department: '设备部', skills: '["maintenance","piping","valves"]', maxWorkHoursPerWeek: 50, status: 'active' },
    { id: 6, code: 'EMP006', name: '周涛', position: '维修技工', department: '设备部', skills: '["maintenance","pumps"]', maxWorkHoursPerWeek: 44, status: 'active' },
    { id: 7, code: 'EMP007', name: '吴斌', position: '维修技工', department: '设备部', skills: '["maintenance","instrument"]', maxWorkHoursPerWeek: 44, status: 'active' },
    { id: 8, code: 'EMP008', name: '郑雷', position: '安全工程师', department: '安全部', skills: '["safety","monitoring"]', maxWorkHoursPerWeek: 48, status: 'active' },
    { id: 9, code: 'EMP009', name: '陈刚', position: '中控操作员', department: '生产部', skills: '["hydrocracking","control_room"]', maxWorkHoursPerWeek: 44, status: 'active' },
    { id: 10, code: 'EMP010', name: '刘华', position: '化验分析师', department: '质量部', skills: '["laboratory","analysis"]', maxWorkHoursPerWeek: 40, status: 'active' }
  ];
}

function getMockShifts(): ShiftItem[] {
  const today = new Date();
  const shifts: ShiftItem[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0];
    shifts.push(
      { id: i * 3 + 1, shiftDate: d, shiftType: '早班', employeeCode: 'EMP002', deviceCode: 'CDU-001', startTime: '08:00', endTime: '16:00', tasks: '常压装置操作' },
      { id: i * 3 + 2, shiftDate: d, shiftType: '中班', employeeCode: 'EMP003', deviceCode: 'FCC-001', startTime: '16:00', endTime: '00:00', tasks: '催化装置操作' },
      { id: i * 3 + 3, shiftDate: d, shiftType: '夜班', employeeCode: 'EMP009', deviceCode: 'HDT-001', startTime: '00:00', endTime: '08:00', tasks: '加氢装置操作' }
    );
  }
  return shifts;
}

function getMockTransitions(): ProcessTransition[] {
  return [
    { id: 1, fromType: 'atmospheric', toType: 'catalytic_cracking', transitionHours: 4, description: '常压切换催化需清塔4小时' },
    { id: 2, fromType: 'atmospheric', toType: 'hydrocracking', transitionHours: 6, description: '常压切换加氢需清洗6小时' },
    { id: 3, fromType: 'catalytic_cracking', toType: 'atmospheric', transitionHours: 5, description: '催化切换常压需降温吹扫5小时' },
    { id: 4, fromType: 'catalytic_cracking', toType: 'hydrocracking', transitionHours: 8, description: '催化切换加氢需深度清洁8小时' },
    { id: 5, fromType: 'hydrocracking', toType: 'atmospheric', transitionHours: 6, description: '加氢切换常压需泄压降温6小时' },
    { id: 6, fromType: 'vacuum_distillation', toType: 'delayed_coking', transitionHours: 3, description: '减压切换焦化需3小时' },
    { id: 7, fromType: 'hydrotreating', toType: 'hydrocracking', transitionHours: 4, description: '精制切换裂化需4小时' }
  ];
}
