export const DEVICE_TYPES: Record<string, string> = {
  atmospheric: '常压蒸馏',
  catalytic_cracking: '催化裂化',
  hydrocracking: '加氢裂化',
  hydrotreating: '加氢精制',
  vacuum_distillation: '减压蒸馏',
  delayed_coking: '延迟焦化'
};

export const DEVICE_STATUS: Record<string, { label: string; color: string }> = {
  running: { label: '运行中', color: 'green' },
  idle: { label: '待机', color: 'default' },
  maintenance: { label: '检修中', color: 'orange' },
  fault: { label: '故障', color: 'red' }
};

export const HEALTH_STATUS: Record<string, { label: string; color: string }> = {
  normal: { label: '正常', color: 'green' },
  warning: { label: '预警', color: 'orange' },
  critical: { label: '危险', color: 'red' },
  maintenance: { label: '检修', color: 'default' },
  idle: { label: '待机', color: 'default' }
};

export const ALARM_LEVEL: Record<string, { label: string; color: string }> = {
  info: { label: '提示', color: 'blue' },
  warning: { label: '警告', color: 'orange' },
  critical: { label: '严重', color: 'red' }
};

export const SCHEDULE_STATUS: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  pending_approval: { label: '待审批', color: 'orange' },
  approved: { label: '已批准', color: 'green' },
  rejected: { label: '已驳回', color: 'red' },
  adjusting: { label: '调整中', color: 'blue' },
  completed: { label: '已完成', color: 'default' }
};

export const WORK_ORDER_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'default' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  cancelled: { label: '已取消', color: 'red' }
};

export const WORK_ORDER_PRIORITY: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'default' },
  medium: { label: '中', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' }
};

export const SHIFT_TYPES = [
  { value: '早班', label: '早班 (08:00-16:00)', start: '08:00', end: '16:00' },
  { value: '中班', label: '中班 (16:00-00:00)', start: '16:00', end: '00:00' },
  { value: '夜班', label: '夜班 (00:00-08:00)', start: '00:00', end: '08:00' }
];
