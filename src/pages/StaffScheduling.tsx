import React, { useEffect, useState, useMemo } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Select, Input,
  Space, message, Row, Col, Statistic, Tabs, Calendar,
  Badge, Tooltip, Popover, List, Avatar, Descriptions, Divider, DatePicker
} from 'antd';
import {
  PlusOutlined, EditOutlined, TeamOutlined, UserOutlined,
  SwapOutlined, CheckCircleOutlined, ClockCircleOutlined,
  WarningOutlined, CalendarOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useAppStore, ShiftItem } from '@/store/appStore';
import { DEVICE_TYPES, SHIFT_TYPES } from '@/utils/constants';

const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SKILL_LABELS: Record<string, string> = {
  atmospheric: '常压蒸馏',
  catalytic_cracking: '催化裂化',
  hydrocracking: '加氢裂化',
  hydrotreating: '加氢精制',
  vacuum_distillation: '减压蒸馏',
  delayed_coking: '延迟焦化',
  control_room: '中控操作',
  maintenance: '设备维护',
  mechanical: '机械维修',
  piping: '管道维修',
  valves: '阀门维修',
  pumps: '泵类维修',
  instrument: '仪表维修',
  safety: '安全管理',
  monitoring: '监测监控',
  scheduling: '生产调度',
  laboratory: '化验分析',
  analysis: '质量分析'
};

const StaffScheduling: React.FC = () => {
  const { devices, employees, shifts, loadAll, saveShift, saveEmployee } = useAppStore();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [shiftModalVisible, setShiftModalVisible] = useState(false);
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftItem | null>(null);
  const [form] = Form.useForm();
  const [empForm] = Form.useForm();
  const [swapForm] = Form.useForm();

  useEffect(() => {
    loadAll();
  }, []);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const weekShifts = shifts.filter(s => dayjs(s.shiftDate).isSame(selectedDate, 'week'));

  const weeklyHoursMap = useMemo(() => {
    const map: Record<string, number> = {};
    weekShifts.forEach(s => {
      const start = dayjs(`2000-01-01 ${s.startTime}`);
      const end = dayjs(`2000-01-01 ${s.endTime}`);
      let hours = end.diff(start, 'hour');
      if (hours <= 0) hours += 24;
      map[s.employeeCode] = (map[s.employeeCode] || 0) + hours;
    });
    return map;
  }, [weekShifts]);

  const autoGenerateShifts = async () => {
    try {
      const weekStart = selectedDate.startOf('week');
      const operators = activeEmployees.filter(e => {
        try {
          const skills = JSON.parse(e.skills);
          return skills.includes('control_room');
        } catch { return false; }
      });

      const deviceCodes = devices.filter(d => d.status === 'running').map(d => d.code);

      for (let day = 0; day < 7; day++) {
        const shiftDate = weekStart.add(day, 'day').format('YYYY-MM-DD');
        SHIFT_TYPES.forEach((shiftType, idx) => {
          const operatorIndex = (day * 3 + idx) % operators.length;
          const deviceIndex = (day * 3 + idx) % deviceCodes.length;
          if (operators[operatorIndex]) {
            const weeklyHours = weeklyHoursMap[operators[operatorIndex].code] || 0;
            if (weeklyHours + 8 <= operators[operatorIndex].maxWorkHoursPerWeek) {
              saveShift({
                shiftDate,
                shiftType: shiftType.value,
                employeeCode: operators[operatorIndex].code,
                deviceCode: deviceCodes[deviceIndex],
                startTime: shiftType.start,
                endTime: shiftType.end,
                tasks: `${DEVICE_TYPES[devices.find(d => d.code === deviceCodes[deviceIndex])?.type || '']}装置操作`
              });
            }
          }
        });
      }
      message.success('智能排班完成，已根据技能标签和工时上限生成排班表');
      loadAll();
    } catch (e) {
      message.error('排班失败');
    }
  };

  const handleAddShift = () => {
    setEditingShift(null);
    form.resetFields();
    form.setFieldsValue({
      shiftDate: selectedDate.format('YYYY-MM-DD'),
      shiftType: '早班',
      startTime: '08:00',
      endTime: '16:00'
    });
    setShiftModalVisible(true);
  };

  const handleEditShift = (shift: ShiftItem) => {
    setEditingShift(shift);
    form.setFieldsValue(shift);
    setShiftModalVisible(true);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    empForm.resetFields();
    setEmployeeModalVisible(true);
  };

  const handleEditEmployee = (emp: any) => {
    setEditingEmployee(emp);
    empForm.setFieldsValue({ ...emp, skills: JSON.parse(emp.skills || '[]') });
    setEmployeeModalVisible(true);
  };

  const submitShift = async () => {
    try {
      const values = await form.validateFields();
      const shiftType = SHIFT_TYPES.find(s => s.value === values.shiftType);
      await saveShift({
        ...editingShift,
        ...values,
        startTime: values.startTime || shiftType?.start,
        endTime: values.endTime || shiftType?.end
      });
      message.success(editingShift ? '排班更新成功' : '排班创建成功');
      setShiftModalVisible(false);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const submitEmployee = async () => {
    try {
      const values = await empForm.validateFields();
      await saveEmployee({
        ...editingEmployee,
        ...values,
        skills: JSON.stringify(values.skills || []),
        status: values.status || 'active'
      });
      message.success(editingEmployee ? '员工信息更新成功' : '员工添加成功');
      setEmployeeModalVisible(false);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const submitSwap = async () => {
    try {
      const values = await swapForm.validateFields();
      if (!selectedShift) return;
      await saveShift({
        ...selectedShift,
        employeeCode: values.swapWith
      });
      message.success('调班申请已提交，待主管审批');
      setSwapModalVisible(false);
      loadAll();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const shiftColumns = [
    { title: '日期', dataIndex: 'shiftDate', key: 'shiftDate', width: 110, render: (d: string) => dayjs(d).format('YYYY-MM-DD ddd') },
    { title: '班次', dataIndex: 'shiftType', key: 'shiftType', width: 80, render: (s: string) => <Tag color={s === '早班' ? 'blue' : s === '中班' ? 'orange' : 'purple'}>{s}</Tag> },
    { title: '时间', key: 'time', width: 130, render: (_: any, r: any) => `${r.startTime} - ${r.endTime}` },
    { title: '员工', dataIndex: 'employeeCode', key: 'employeeCode', width: 140, render: (c: string) => {
      const e = employees.find(x => x.code === c);
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{e?.name || c}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{e?.position}</div>
          </div>
        </div>
      );
    }},
    { title: '装置', dataIndex: 'deviceCode', key: 'deviceCode', width: 160, render: (c: string) => {
      const d = devices.find(x => x.code === c);
      return <div><div>{d?.name || c}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{d ? DEVICE_TYPES[d.type] : ''}</div></div>;
    }},
    { title: '本周工时', key: 'weeklyHours', width: 100, render: (_: any, r: any) => {
      const hours = weeklyHoursMap[r.employeeCode] || 0;
      const emp = employees.find(e => e.code === r.employeeCode);
      const max = emp?.maxWorkHoursPerWeek || 44;
      const over = hours > max;
      return (
        <div>
          <span style={{ color: over ? '#ff4d4f' : '#52c41a', fontWeight: over ? 600 : 400 }}>{hours}h</span>
          <span style={{ color: '#8c8c8c' }}>/{max}h</span>
          {over && <Tooltip title="超出工时上限"><WarningOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} /></Tooltip>}
        </div>
      );
    }},
    { title: '任务', dataIndex: 'tasks', key: 'tasks', ellipsis: true },
    { title: '操作', key: 'action', width: 160, render: (_: any, r: ShiftItem) => (
      <Space size="small">
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditShift(r)}>编辑</Button>
        <Button size="small" icon={<SwapOutlined />} onClick={() => { setSelectedShift(r); setSwapModalVisible(true); }}>调班</Button>
      </Space>
    )}
  ];

  const employeeColumns = [
    { title: '工号', dataIndex: 'code', key: 'code', width: 80 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100, render: (n: string, r: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar size="small" style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
        <span style={{ fontWeight: 500 }}>{n}</span>
      </div>
    )},
    { title: '岗位', dataIndex: 'position', key: 'position', width: 100 },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '技能标签', dataIndex: 'skills', key: 'skills', render: (s: string) => {
      try {
        const skills = JSON.parse(s);
        return <Space wrap>{skills.map((sk: string) => <Tag key={sk} color="blue">{SKILL_LABELS[sk] || sk}</Tag>)}</Space>;
      } catch { return '-'; }
    }},
    { title: '周工时上限', dataIndex: 'maxWorkHoursPerWeek', key: 'maxWorkHoursPerWeek', width: 100, render: (h: number) => `${h}h` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '在职' : '离职'}</Tag> },
    { title: '操作', key: 'action', width: 100, render: (_: any, r: any) => <Button size="small" icon={<EditOutlined />} onClick={() => handleEditEmployee(r)}>编辑</Button> }
  ];

  const dateCellRender = (value: Dayjs) => {
    const dayShifts = shifts.filter(s => dayjs(s.shiftDate).isSame(value, 'day'));
    if (dayShifts.length === 0) return null;
    return (
      <List
        size="small"
        dataSource={dayShifts}
        renderItem={(s) => {
          const e = employees.find(x => x.code === s.employeeCode);
          const color = s.shiftType === '早班' ? 'blue' : s.shiftType === '中班' ? 'orange' : 'purple';
          return (
            <List.Item style={{ padding: '2px 0' }}>
              <Badge color={color} text={<span style={{ fontSize: 12 }}>{e?.name || s.employeeCode}</span>} />
            </List.Item>
          );
        }}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="在职员工" value={activeEmployees.length} valueStyle={{ color: '#1677ff' }} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本周排班数" value={weekShifts.length} valueStyle={{ color: '#52c41a' }} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="运行装置数" value={devices.filter(d => d.status === 'running').length} valueStyle={{ color: '#722ed1' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="超工时预警" value={Object.entries(weeklyHoursMap).filter(([code, h]) => {
              const emp = employees.find(e => e.code === code);
              return h > (emp?.maxWorkHoursPerWeek || 44);
            }).length} valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="calendar">
          <TabPane tab="日历视图" key="calendar">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{selectedDate.format('YYYY年 M月')} 排班日历</span>
                <Tag color="blue">早班</Tag>
                <Tag color="orange">中班</Tag>
                <Tag color="purple">夜班</Tag>
              </Space>
              <Space>
                <Button type="primary" icon={<CalendarOutlined />} onClick={autoGenerateShifts}>智能排班</Button>
                <Button icon={<PlusOutlined />} onClick={handleAddShift}>手动排班</Button>
              </Space>
            </div>
            <Card style={{ background: '#fff' }}>
              <Calendar
                value={selectedDate}
                onChange={setSelectedDate}
                cellRender={dateCellRender}
                fullscreen
              />
            </Card>
          </TabPane>
          <TabPane tab="排班列表" key="list">
            <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <RangePicker
                value={[selectedDate.startOf('week'), selectedDate.endOf('week')]}
                onChange={(dates) => dates && dates[0] && setSelectedDate(dates[0])}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddShift}>添加排班</Button>
            </div>
            <Table
              rowKey="id"
              columns={shiftColumns}
              dataSource={weekShifts.sort((a, b) => dayjs(a.shiftDate).valueOf() - dayjs(b.shiftDate).valueOf())}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1100 }}
            />
          </TabPane>
          <TabPane tab="员工管理" key="employees">
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddEmployee}>添加员工</Button>
            </div>
            <Table
              rowKey="id"
              columns={employeeColumns}
              dataSource={employees}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1100 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingShift ? '编辑排班' : '添加排班'}
        open={shiftModalVisible}
        onOk={submitShift}
        onCancel={() => setShiftModalVisible(false)}
        width={560}
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shiftDate" label="排班日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shiftType" label="班次" rules={[{ required: true }]}>
                <Select onChange={(v) => {
                  const st = SHIFT_TYPES.find(s => s.value === v);
                  if (st) form.setFieldsValue({ startTime: st.start, endTime: st.end });
                }}>
                  {SHIFT_TYPES.map(s => <Option key={s.value} value={s.value}>{s.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
                <Select>
                  {['00:00', '08:00', '16:00', '20:00'].map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
                <Select>
                  {['08:00', '16:00', '00:00', '20:00'].map(t => <Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="employeeCode" label="排班人员" rules={[{ required: true }]}>
                <Select placeholder="选择员工" showSearch>
                  {activeEmployees.map(e => <Option key={e.code} value={e.code}>{e.name} ({e.position})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deviceCode" label="负责装置">
                <Select placeholder="选择装置" allowClear showSearch>
                  {devices.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tasks" label="工作任务">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingEmployee ? '编辑员工信息' : '添加员工'}
        open={employeeModalVisible}
        onOk={submitEmployee}
        onCancel={() => setEmployeeModalVisible(false)}
        width={600}
        okText="保存"
      >
        <Form form={empForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="code" label="工号" rules={[{ required: true }]}>
                <Input placeholder="如: EMP011" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="active">
                <Select>
                  <Option value="active">在职</Option>
                  <Option value="inactive">离职</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="position" label="岗位" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="部门" rules={[{ required: true }]}>
                <Select>
                  <Option value="生产部">生产部</Option>
                  <Option value="设备部">设备部</Option>
                  <Option value="安全部">安全部</Option>
                  <Option value="质量部">质量部</Option>
                  <Option value="技术部">技术部</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="skills" label="技能标签" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="选择技能标签">
              {Object.entries(SKILL_LABELS).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="maxWorkHoursPerWeek" label="每周工时上限(小时)" initialValue={44} rules={[{ required: true }]}>
            <InputNumber min={0} max={168} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请调班"
        open={swapModalVisible}
        onOk={submitSwap}
        onCancel={() => setSwapModalVisible(false)}
        okText="提交申请"
        width={500}
      >
        {selectedShift && (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="日期">{selectedShift.shiftDate}</Descriptions.Item>
              <Descriptions.Item label="班次">{selectedShift.shiftType}</Descriptions.Item>
              <Descriptions.Item label="当前人员">
                {employees.find(e => e.code === selectedShift.employeeCode)?.name || selectedShift.employeeCode}
              </Descriptions.Item>
              <Descriptions.Item label="负责装置">
                {devices.find(d => d.code === selectedShift.deviceCode)?.name || selectedShift.deviceCode}
              </Descriptions.Item>
            </Descriptions>
            <Form form={swapForm} layout="vertical">
              <Form.Item name="swapWith" label="调班人员" rules={[{ required: true, message: '请选择调班人员' }]}>
                <Select placeholder="选择要调换的人员" showSearch>
                  {activeEmployees
                    .filter(e => e.code !== selectedShift.employeeCode)
                    .map(e => <Option key={e.code} value={e.code}>{e.name} ({e.position})</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="reason" label="调班原因" rules={[{ required: true, message: '请填写调班原因' }]}>
                <Input.TextArea rows={3} placeholder="请详细说明调班原因" />
              </Form.Item>
            </Form>
            <Divider style={{ margin: '8px 0 12px' }} />
            <p style={{ fontSize: 12, color: '#8c8c8c' }}>调班申请需经生产主管审批后方可生效</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StaffScheduling;
