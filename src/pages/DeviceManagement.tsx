import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm, Descriptions, Row, Col, Statistic, Progress } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, ThunderboltOutlined, CheckCircleOutlined, ToolOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppStore, Device } from '@/store/appStore';
import { DEVICE_TYPES, DEVICE_STATUS, HEALTH_STATUS } from '@/utils/constants';

const { Option } = Select;

const DeviceManagement: React.FC = () => {
  const { devices, deviceStatuses, loadDevices, loadDeviceStatuses, saveDevice, removeDevice } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDevices();
    loadDeviceStatuses();
  }, []);

  const handleAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue(device);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    await removeDevice(id);
    message.success('删除成功');
    loadDevices();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await saveDevice({ ...editingDevice, ...values });
      message.success(editingDevice ? '更新成功' : '添加成功');
      setModalVisible(false);
      loadDevices();
    } catch (e) {
      console.error(e);
    }
  };

  const showDetail = (device: Device) => {
    setSelectedDevice(device);
    setDetailVisible(true);
  };

  const getStatus = (code: string) => deviceStatuses.find(s => s.deviceCode === code);

  const runningCount = devices.filter(d => d.status === 'running').length;
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length;
  const idleCount = devices.filter(d => d.status === 'idle').length;
  const totalCapacity = devices.reduce((sum, d) => sum + d.designCapacity, 0);

  const columns = [
    { title: '装置编号', dataIndex: 'code', key: 'code', width: 100 },
    { title: '装置名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '装置类型', dataIndex: 'type', key: 'type', width: 120, render: (t: string) => DEVICE_TYPES[t] || t },
    { title: '设计产能', dataIndex: 'designCapacity', key: 'designCapacity', width: 110, render: (v: number) => `${v} 万吨/年` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => {
        const st = DEVICE_STATUS[s];
        return <Tag color={st?.color}>{st?.label || s}</Tag>;
      }
    },
    {
      title: '当前温度', key: 'temperature', width: 110,
      render: (_: any, r: Device) => {
        const st = getStatus(r.code);
        if (!st || r.status !== 'running') return '-';
        return <span style={{ color: st.temperature > r.temperatureMax * 0.95 ? '#ff4d4f' : '#52c41a' }}>{st.temperature.toFixed(1)} ℃</span>;
      }
    },
    {
      title: '当前压力', key: 'pressure', width: 110,
      render: (_: any, r: Device) => {
        const st = getStatus(r.code);
        if (!st || r.status !== 'running') return '-';
        return `${st.pressure.toFixed(2)} ${r.type.includes('hydro') ? 'MPa' : 'MPa'}`;
      }
    },
    {
      title: '运行时长', key: 'runHours', width: 100,
      render: (_: any, r: Device) => {
        const st = getStatus(r.code);
        return st ? `${st.runHours} h` : '-';
      }
    },
    {
      title: '健康状况', key: 'health', width: 100,
      render: (_: any, r: Device) => {
        const st = getStatus(r.code);
        if (!st) return '-';
        const hs = HEALTH_STATUS[st.healthStatus];
        return <Tag color={hs?.color}>{hs?.label || st.healthStatus}</Tag>;
      }
    },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: any, r: Device) => (
        <Space size="small">
          <Button size="small" icon={<InfoCircleOutlined />} onClick={() => showDetail(r)}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除该装置吗？" onConfirm={() => handleDelete(r.id!)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="运行装置" value={runningCount} suffix={`/ ${devices.length}`} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="检修装置" value={maintenanceCount} valueStyle={{ color: '#faad14' }} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待机装置" value={idleCount} valueStyle={{ color: '#8c8c8c' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="总设计产能" value={totalCapacity} suffix="万吨/年" valueStyle={{ color: '#1677ff' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        title="装置列表"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增装置</Button>}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={devices}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      <Modal
        title={editingDevice ? '编辑装置' : '新增装置'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={640}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="装置编号" rules={[{ required: true, message: '请输入装置编号' }]}>
                <Input placeholder="如: CDU-003" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="装置名称" rules={[{ required: true, message: '请输入装置名称' }]}>
                <Input placeholder="如: 常压蒸馏装置3号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="装置类型" rules={[{ required: true, message: '请选择装置类型' }]}>
                <Select placeholder="选择装置类型">
                  {Object.entries(DEVICE_TYPES).map(([v, l]) => <Option key={v} value={v}>{l}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="运行状态" initialValue="idle">
                <Select>
                  {Object.entries(DEVICE_STATUS).map(([v, l]) => <Option key={v} value={v}>{l.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="designCapacity" label="设计产能(万吨/年)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="temperatureMin" label="温度下限(℃)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="temperatureMax" label="温度上限(℃)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pressureMin" label="压力下限(MPa)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pressureMax" label="压力上限(MPa)" rules={[{ required: true }]}>
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="装置描述">
            <Input.TextArea rows={3} placeholder="请输入装置描述信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="装置详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={720}
      >
        {selectedDevice && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="装置编号">{selectedDevice.code}</Descriptions.Item>
              <Descriptions.Item label="装置名称">{selectedDevice.name}</Descriptions.Item>
              <Descriptions.Item label="装置类型">{DEVICE_TYPES[selectedDevice.type]}</Descriptions.Item>
              <Descriptions.Item label="运行状态"><Tag color={DEVICE_STATUS[selectedDevice.status].color}>{DEVICE_STATUS[selectedDevice.status].label}</Tag></Descriptions.Item>
              <Descriptions.Item label="设计产能">{selectedDevice.designCapacity} 万吨/年</Descriptions.Item>
              <Descriptions.Item label="安全温度范围">{selectedDevice.temperatureMin} ~ {selectedDevice.temperatureMax} ℃</Descriptions.Item>
              <Descriptions.Item label="安全压力范围" span={2}>{selectedDevice.pressureMin} ~ {selectedDevice.pressureMax} MPa</Descriptions.Item>
            </Descriptions>
            {(() => {
              const st = getStatus(selectedDevice.code);
              if (!st) return null;
              return (
                <Card title="实时运行数据" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>反应温度</div>
                        <Progress
                          percent={Math.min(100, ((st.temperature - selectedDevice.temperatureMin) / (selectedDevice.temperatureMax - selectedDevice.temperatureMin)) * 100)}
                          format={() => `${st.temperature.toFixed(1)} ℃`}
                          strokeColor={st.temperature > selectedDevice.temperatureMax * 0.95 ? '#ff4d4f' : '#52c41a'}
                        />
                      </div>
                      <div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>液位</div>
                        <Progress percent={st.level} format={() => `${st.level.toFixed(1)} %`} />
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>系统压力</div>
                        <Progress
                          percent={Math.min(100, ((st.pressure - selectedDevice.pressureMin) / (selectedDevice.pressureMax - selectedDevice.pressureMin)) * 100)}
                          format={() => `${st.pressure.toFixed(2)} MPa`}
                          strokeColor="#1677ff"
                        />
                      </div>
                      <div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>运行时长</div>
                        <div style={{ fontSize: 24, fontWeight: 600 }}>{st.runHours} <span style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 400 }}>小时</span></div>
                      </div>
                    </Col>
                  </Row>
                </Card>
              );
            })()}
            {selectedDevice.description && (
              <Card title="装置描述" size="small" style={{ marginTop: 16 }}>
                {selectedDevice.description}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeviceManagement;
