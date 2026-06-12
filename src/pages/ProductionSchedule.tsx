import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, DatePicker, Space, Modal, Form, Select, Input, InputNumber,
  message, Descriptions, Row, Col, Statistic, Timeline, Tooltip, Divider, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, ThunderboltOutlined, ScheduleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, RobotOutlined, InfoCircleOutlined,
  SwapOutlined, SafetyOutlined, AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore, ProductionScheduleItem } from '@/store/appStore';
import { DEVICE_TYPES, SCHEDULE_STATUS, DEVICE_STATUS } from '@/utils/constants';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface GeneratedSchedule {
  deviceCode: string;
  shift: string;
  product: string;
  plannedOutput: number;
  startTime: string;
  endTime: string;
  rawMaterials: string;
  reason: string;
  transitionHours?: number;
}

const ProductionSchedule: React.FC = () => {
  const { devices, deviceStatuses, rawMaterials, schedules, transitions, workOrders, loadAll, saveSchedule } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ProductionScheduleItem | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionScheduleItem | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([]);
  const [showGenerated, setShowGenerated] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAll();
  }, []);

  const filteredSchedules = schedules.filter(s => dayjs(s.scheduleDate).isSame(selectedDate, 'day'));

  const generateSchedule = () => {
    setGenerating(true);
    setTimeout(() => {
      const results: GeneratedSchedule[] = [];
      const runningDevices = devices.filter(d => d.status === 'running');
      const maintenancePlans = workOrders.filter(w =>
        w.status !== 'completed' && w.plannedDate && dayjs(w.plannedDate).isSame(selectedDate, 'day')
      );
      const maintenanceDeviceCodes = maintenancePlans.map(m => m.deviceCode);
      const availableDevices = runningDevices.filter(d => !maintenanceDeviceCodes.includes(d.code));

      availableDevices.forEach((device, idx) => {
        const status = deviceStatuses.find(s => s.deviceCode === device.code);
        const shift = idx % 2 === 0 ? '白班' : '白班';
        let product = '';
        let output = 0;
        let materials = '';

        switch (device.type) {
          case 'atmospheric':
            product = '直馏汽油/柴油/煤油';
            output = Math.round(device.designCapacity * 0.85 * 12);
            const crudeOil = rawMaterials.find(m => m.type === 'crude_oil');
            materials = `${crudeOil?.code || 'CRUDE-001'}: ${Math.round(output * 1.5)}吨`;
            break;
          case 'catalytic_cracking':
            product = '催化汽油/LPG/柴油';
            output = Math.round(device.designCapacity * 0.80 * 12);
            const vgo = rawMaterials.find(m => m.code.includes('VGO'));
            materials = `${vgo?.code || 'VGO-001'}: ${Math.round(output * 1.2)}吨`;
            break;
          case 'hydrocracking':
            product = '加氢裂化柴油/航煤';
            output = Math.round(device.designCapacity * 0.75 * 12);
            const h2 = rawMaterials.find(m => m.type === 'utility');
            materials = `VGO-001: ${Math.round(output * 1.1)}吨, ${h2?.code || 'H2-001'}: ${Math.round(output * 80)}Nm³`;
            break;
          case 'hydrotreating':
            product = '精制柴油';
            output = Math.round(device.designCapacity * 0.85 * 12);
            materials = `AR-001: ${Math.round(output * 0.9)}吨`;
            break;
          case 'vacuum_distillation':
            product = '减压蜡油/渣油';
            output = Math.round(device.designCapacity * 0.80 * 12);
            materials = `CRUDE-002: ${Math.round(output * 1.3)}吨`;
            break;
          case 'delayed_coking':
            product = '石油焦/焦化汽柴油';
            output = Math.round(device.designCapacity * 0.70 * 12);
            materials = `VR-RESIDUE: ${Math.round(output * 1.4)}吨`;
            break;
          default:
            product = '产品';
            output = Math.round(device.designCapacity * 0.8 * 12);
        }

        let transitionHours = 0;
        let reason = '装置状态正常，按设计产能80%排产';

        if (status) {
          if (status.healthStatus === 'warning') {
            output = Math.round(output * 0.85);
            reason = '装置预警运行，降负荷至设计产能68%';
          }
          if (status.temperature > device.temperatureMax * 0.9) {
            output = Math.round(output * 0.8);
            reason = '温度接近上限，降负荷保障安全';
          }
        }

        if (idx > 0) {
          const prevDevice = availableDevices[idx - 1];
          const transition = transitions.find(t => t.fromType === prevDevice.type && t.toType === device.type);
          if (transition) {
            transitionHours = transition.transitionHours;
            reason += `; 工艺切换需${transitionHours}小时(自${DEVICE_TYPES[prevDevice.type]}切换)`;
          }
        }

        results.push({
          deviceCode: device.code,
          shift,
          product,
          plannedOutput: output,
          startTime: transitionHours > 0 ? `${8 + transitionHours}:00` : '08:00',
          endTime: '20:00',
          rawMaterials: materials,
          reason,
          transitionHours
        });
      });

      setGeneratedSchedules(results);
      setShowGenerated(true);
      setGenerating(false);
      message.success(`智能排产完成，生成 ${results.length} 条排产方案`);
    }, 1500);
  };

  const applyGeneratedSchedules = async () => {
    try {
      for (const gs of generatedSchedules) {
        await saveSchedule({
          scheduleDate: selectedDate.format('YYYY-MM-DD'),
          ...gs,
          actualOutput: 0,
          status: 'pending_approval'
        });
      }
      message.success('排产方案已保存，待审批');
      setShowGenerated(false);
      loadAll();
    } catch (e) {
      message.error('保存失败');
    }
  };

  const handleAdd = () => {
    setEditingSchedule(null);
    form.resetFields();
    form.setFieldsValue({
      scheduleDate: selectedDate.format('YYYY-MM-DD'),
      shift: '白班',
      startTime: '08:00',
      endTime: '20:00',
      status: 'draft'
    });
    setModalVisible(true);
  };

  const handleEdit = (schedule: ProductionScheduleItem) => {
    setEditingSchedule(schedule);
    form.setFieldsValue(schedule);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await saveSchedule({ ...editingSchedule, ...values });
      message.success(editingSchedule ? '更新成功' : '添加成功');
      setModalVisible(false);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const showDetail = (schedule: ProductionScheduleItem) => {
    setSelectedSchedule(schedule);
    setDetailVisible(true);
  };

  const columns = [
    { title: '班次', dataIndex: 'shift', key: 'shift', width: 80, render: (s: string) => <Tag color={s === '白班' ? 'blue' : 'purple'}>{s}</Tag> },
    { title: '装置', dataIndex: 'deviceCode', key: 'deviceCode', width: 110, render: (c: string) => {
      const d = devices.find(x => x.code === c);
      return <div><div style={{ fontWeight: 500 }}>{d?.name || c}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{c}</div></div>;
    }},
    { title: '产品', dataIndex: 'product', key: 'product', width: 160 },
    { title: '计划产量', dataIndex: 'plannedOutput', key: 'plannedOutput', width: 110, render: (v: number) => `${v} 吨` },
    { title: '实际产量', dataIndex: 'actualOutput', key: 'actualOutput', width: 110, render: (v: number, r: any) => (
      <div>
        <div>{v} 吨</div>
        <div style={{ color: r.plannedOutput > 0 ? (v / r.plannedOutput >= 0.95 ? '#52c41a' : '#faad14') : '#8c8c8c', fontSize: 12 }}>
          {r.plannedOutput > 0 ? ((v / r.plannedOutput) * 100).toFixed(1) : 0}%
        </div>
      </div>
    )},
    { title: '时间', key: 'time', width: 130, render: (_: any, r: any) => `${r.startTime} - ${r.endTime}` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => {
      const st = SCHEDULE_STATUS[s];
      return <Tag color={st?.color}>{st?.label || s}</Tag>;
    }},
    {
      title: '操作', key: 'action', width: 180,
      render: (_: any, r: ProductionScheduleItem) => (
        <Space size="small">
          <Button size="small" icon={<InfoCircleOutlined />} onClick={() => showDetail(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
        </Space>
      )
    }
  ];

  const pendingApprovalCount = filteredSchedules.filter(s => s.status === 'pending_approval').length;
  const approvedCount = filteredSchedules.filter(s => s.status === 'approved').length;
  const totalPlanned = filteredSchedules.reduce((sum, s) => sum + s.plannedOutput, 0);
  const totalActual = filteredSchedules.reduce((sum, s) => sum + s.actualOutput, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="待审批方案" value={pendingApprovalCount} valueStyle={{ color: '#faad14' }} prefix={<ScheduleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已批准方案" value={approvedCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="计划总产量" value={totalPlanned} suffix="吨" valueStyle={{ color: '#1677ff' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="实际完成" value={totalActual} suffix="吨" valueStyle={{ color: totalActual / totalPlanned >= 0.9 ? '#52c41a' : '#faad14' }} prefix={<AppstoreOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title="排产计划"
        extra={
          <Space>
            <DatePicker value={selectedDate} onChange={(d) => d && setSelectedDate(d)} style={{ width: 160 }} />
            <Button icon={<RobotOutlined />} type="primary" onClick={generateSchedule} loading={generating}>
              智能排产
            </Button>
            <Button icon={<PlusOutlined />} onClick={handleAdd}>手动排产</Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          icon={<SafetyOutlined />}
          message="智能排产算法会综合考虑原料供应、设备状态、检修计划、工艺切换时间和温度压力安全约束，自动生成最优方案"
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredSchedules}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="智能排产结果预览"
        open={showGenerated}
        onOk={applyGeneratedSchedules}
        onCancel={() => setShowGenerated(false)}
        width={900}
        okText="应用排产方案"
        cancelText="取消"
        okButtonProps={{ type: 'primary' }}
      >
        <Alert
          type="success"
          showIcon
          message={`共生成 ${generatedSchedules.length} 条排产方案，应用后将提交至生产主管审批`}
          style={{ marginBottom: 16 }}
        />
        <Timeline
          items={generatedSchedules.map((gs, idx) => {
            const d = devices.find(x => x.code === gs.deviceCode);
            return {
              color: gs.transitionHours && gs.transitionHours > 0 ? 'orange' : 'blue',
              children: (
                <Card size="small" title={`${d?.name || gs.deviceCode} - ${gs.shift}`} extra={<Tag color="blue">{gs.product}</Tag>}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic title="计划产量" value={gs.plannedOutput} suffix="吨" valueStyle={{ fontSize: 18 }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="运行时间" value={`${gs.startTime} - ${gs.endTime}`} valueStyle={{ fontSize: 14 }} />
                    </Col>
                    <Col span={8}>
                      {gs.transitionHours && gs.transitionHours > 0 ? (
                        <Tooltip title="工艺切换">
                          <Statistic prefix={<SwapOutlined />} title="工艺切换" value={`${gs.transitionHours}小时`} valueStyle={{ fontSize: 14, color: '#faad14' }} />
                        </Tooltip>
                      ) : (
                        <Statistic title="原料" value={gs.rawMaterials?.split(':')[0] || '-'} valueStyle={{ fontSize: 14 }} />
                      )}
                    </Col>
                  </Row>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <strong>排产依据：</strong>{gs.reason}
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    <strong>原料需求：</strong>{gs.rawMaterials}
                  </div>
                </Card>
              )
            };
          })}
        />
      </Modal>

      <Modal
        title={editingSchedule ? '编辑排产' : '手动排产'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="scheduleDate" label="排产日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="shift" label="班次" rules={[{ required: true }]}>
                <Select>
                  <Option value="白班">白班</Option>
                  <Option value="中班">中班</Option>
                  <Option value="夜班">夜班</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceCode" label="生产装置" rules={[{ required: true }]}>
                <Select placeholder="选择装置" showSearch>
                  {devices.filter(d => d.status === 'running').map(d => (
                    <Option key={d.code} value={d.code}>{d.name} ({DEVICE_TYPES[d.type]})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="product" label="产品方案" rules={[{ required: true }]}>
                <Input placeholder="如：直馏汽油/柴油" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plannedOutput" label="计划产量(吨)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
                <Select>
                  <Option value="00:00">00:00</Option>
                  <Option value="08:00">08:00</Option>
                  <Option value="16:00">16:00</Option>
                  <Option value="20:00">20:00</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
                <Select>
                  <Option value="08:00">08:00</Option>
                  <Option value="16:00">16:00</Option>
                  <Option value="20:00">20:00</Option>
                  <Option value="00:00">00:00</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="rawMaterials" label="原料配置">
            <Input placeholder="如：CRUDE-001: 30000吨" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="draft">
            <Select>
              {Object.entries(SCHEDULE_STATUS).map(([v, l]) => <Option key={v} value={v}>{l.label}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="排产详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={640}
      >
        {selectedSchedule && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="日期">{selectedSchedule.scheduleDate}</Descriptions.Item>
              <Descriptions.Item label="班次">{selectedSchedule.shift}</Descriptions.Item>
              <Descriptions.Item label="装置">
                {devices.find(d => d.code === selectedSchedule.deviceCode)?.name || selectedSchedule.deviceCode}
              </Descriptions.Item>
              <Descriptions.Item label="产品">{selectedSchedule.product}</Descriptions.Item>
              <Descriptions.Item label="计划产量">{selectedSchedule.plannedOutput} 吨</Descriptions.Item>
              <Descriptions.Item label="实际产量">
                {selectedSchedule.actualOutput} 吨
                ({selectedSchedule.plannedOutput > 0 ? ((selectedSchedule.actualOutput / selectedSchedule.plannedOutput) * 100).toFixed(1) : 0}%)
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedSchedule.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{selectedSchedule.endTime}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={SCHEDULE_STATUS[selectedSchedule.status]?.color}>
                  {SCHEDULE_STATUS[selectedSchedule.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="原料">{selectedSchedule.rawMaterials || '-'}</Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{selectedSchedule.notes || '-'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductionSchedule;
