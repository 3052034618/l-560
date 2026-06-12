import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Select, Input, InputNumber,
  Space, message, Row, Col, Statistic, DatePicker, Progress, Badge,
  Tabs, Timeline, Tooltip, Divider, Drawer, Descriptions, List, Alert
} from 'antd';
import {
  PlusOutlined, EditOutlined, ToolOutlined, InboxOutlined,
  WarningOutlined, CheckCircleOutlined, ClockCircleOutlined,
  SaveOutlined, TeamOutlined, FileTextOutlined, HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore, MaintenanceWorkOrder, SparePart, Device, DeviceStatus } from '@/store/appStore';
import { DEVICE_TYPES, WORK_ORDER_STATUS, WORK_ORDER_PRIORITY } from '@/utils/constants';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface CycleWorkOrder {
  deviceCode: string;
  deviceName: string;
  runHours: number;
  threshold: number;
  overdue: number;
  workType: string;
  priority: string;
  description: string;
}

const MaintenanceManagement: React.FC = () => {
  const { devices, deviceStatuses, workOrders, spareParts, employees, loadAll, saveWorkOrder, saveSparePart } = useAppStore();
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [partModalVisible, setPartModalVisible] = useState(false);
  const [cycleModalVisible, setCycleModalVisible] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState<MaintenanceWorkOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<MaintenanceWorkOrder | null>(null);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [cycleWorkOrders, setCycleWorkOrders] = useState<CycleWorkOrder[]>([]);
  const [form] = Form.useForm();
  const [partForm] = Form.useForm();

  useEffect(() => {
    loadAll();
  }, []);

  const lowStockParts = spareParts.filter(p => p.stock < p.safetyStock * 1.2);
  const criticalStockParts = spareParts.filter(p => p.stock < p.safetyStock);
  const pendingOrders = workOrders.filter(w => w.status === 'pending');
  const inProgressOrders = workOrders.filter(w => w.status === 'in_progress');
  const completedOrders = workOrders.filter(w => w.status === 'completed');

  const handleAddOrder = () => {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'pending',
      priority: 'medium',
      workType: '预防性维护'
    });
    setOrderModalVisible(true);
  };

  const handleEditOrder = (order: MaintenanceWorkOrder) => {
    setEditingOrder(order);
    form.setFieldsValue(order);
    setOrderModalVisible(true);
  };

  const generateCycleWorkOrders = () => {
    const thresholdMap: Record<string, number> = {
      'atmospheric': 2000,
      'catalytic': 3000,
      'hydrocracking': 4000,
      'coking': 2500,
      'reforming': 3500
    };
    const existingDeviceCodes = workOrders
      .filter(w => w.status !== 'completed' && w.workType === '周期维保')
      .map(w => w.deviceCode);

    const orders: CycleWorkOrder[] = [];
    for (const device of devices) {
      if (existingDeviceCodes.includes(device.code)) continue;
      const status = deviceStatuses.find(s => s.deviceCode === device.code);
      if (!status) continue;
      const threshold = thresholdMap[device.type] || 3000;
      if (status.runHours >= threshold * 0.9) {
        const overdue = Math.max(0, status.runHours - threshold);
        orders.push({
          deviceCode: device.code,
          deviceName: device.name,
          runHours: status.runHours,
          threshold,
          overdue,
          workType: '周期维保',
          priority: overdue > 500 ? 'high' : overdue > 0 ? 'medium' : 'low',
          description: `${device.name}已运行${status.runHours.toFixed(0)}小时，达到维保阈值${threshold}小时，需进行周期维保${overdue > 0 ? `（已超期${overdue.toFixed(0)}小时）` : '（即将到期）'}`
        });
      }
    }
    setCycleWorkOrders(orders.sort((a, b) => b.overdue - a.overdue));
    setCycleModalVisible(true);
  };

  const confirmGenerateCycleWorkOrders = async () => {
    try {
      const savedOrders: MaintenanceWorkOrder[] = [];
      for (const cwo of cycleWorkOrders) {
        const orderNum = `WO-CY-${dayjs().format('YYYYMMDD')}-${String(workOrders.length + savedOrders.length + 1).padStart(3, '0')}`;
        const order: MaintenanceWorkOrder = {
          orderNumber: orderNum,
          deviceCode: cwo.deviceCode,
          workType: cwo.workType,
          description: cwo.description,
          priority: cwo.priority,
          status: 'pending',
          plannedDate: dayjs().format('YYYY-MM-DD'),
          laborHours: 8
        };
        const saved = await saveWorkOrder(order);
        if (saved) savedOrders.push(saved);
      }
      message.success(`成功生成 ${savedOrders.length} 条周期维保工单`);
      setCycleModalVisible(false);
      setCycleWorkOrders([]);
      await loadAll();
    } catch (e) {
      console.error(e);
      message.error('生成周期维保工单失败');
    }
  };

  const handleAddPart = () => {
    setEditingPart(null);
    partForm.resetFields();
    setPartModalVisible(true);
  };

  const handleEditPart = (part: SparePart) => {
    setEditingPart(part);
    partForm.setFieldsValue(part);
    setPartModalVisible(true);
  };

  const submitOrder = async () => {
    try {
      const values = await form.validateFields();
      const orderData: MaintenanceWorkOrder = {
        ...editingOrder,
        ...values,
        orderNumber: editingOrder?.orderNumber || `WO-${dayjs().format('YYYYMMDD-HHmm')}`,
        laborHours: values.laborHours || 0
      };
      await saveWorkOrder(orderData);
      message.success(editingOrder ? '工单更新成功' : '工单创建成功');
      setOrderModalVisible(false);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const submitPart = async () => {
    try {
      const values = await partForm.validateFields();
      await saveSparePart({ ...editingPart, ...values });
      message.success(editingPart ? '备件更新成功' : '备件添加成功');
      setPartModalVisible(false);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const parseSpareParts = (sparePartsStr: string | null | undefined): Array<{code: string, quantity: number, original: string}> => {
    if (!sparePartsStr) return [];
    const result: Array<{code: string, quantity: number, original: string}> = [];
    try {
      const parsed = JSON.parse(sparePartsStr);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p.code && typeof p.quantity === 'number') {
            result.push({ code: p.code, quantity: p.quantity, original: `${p.code} x${p.quantity}` });
          }
        }
      }
    } catch {
      try {
        const parts = sparePartsStr.split(/[,，]/);
        for (const part of parts) {
          const match = part.trim().match(/(SP-\d+)[\s:：]+(\d+)/);
          if (match) {
            result.push({ code: match[1], quantity: parseInt(match[2]), original: part.trim() });
          }
        }
      } catch (e) {
        console.error('解析备件清单失败', e);
      }
    }
    return result;
  };

  const completeOrder = async (order: MaintenanceWorkOrder) => {
    try {
      const parts = parseSpareParts(order.spareParts);
      const failedParts: string[] = [];
      const successParts: string[] = [];
      const lowStockWarnings: string[] = [];

      for (const part of parts) {
        const sp = spareParts.find(p => p.code === part.code);
        if (sp) {
          const newStock = Math.max(0, sp.stock - part.quantity);
          await saveSparePart({ ...sp, stock: newStock });
          successParts.push(part.original);
          if (newStock < sp.safetyStock) {
            lowStockWarnings.push(`${sp.name} (${sp.code}): 库存 ${newStock} < 安全库存 ${sp.safetyStock}`);
          }
        } else {
          failedParts.push(part.original);
        }
      }

      await saveWorkOrder({
        ...order,
        status: 'completed',
        completedDate: dayjs().format('YYYY-MM-DD')
      });

      let msg = '工单已完成';
      if (successParts.length > 0) msg += `，已扣减备件: ${successParts.join(', ')}`;
      if (failedParts.length > 0) msg += `（未找到备件: ${failedParts.join(', ')}）`;
      message.success(msg);

      if (lowStockWarnings.length > 0) {
        message.warning(`低库存预警: ${lowStockWarnings.join('; ')}`);
      }

      await loadAll();
    } catch (e) {
      console.error(e);
      try {
        await saveWorkOrder({
          ...order,
          status: 'completed',
          completedDate: dayjs().format('YYYY-MM-DD')
        });
        message.success('工单已完成（备件扣减异常，请手动核对库存）');
        await loadAll();
      } catch (e2) {
        message.error('操作失败');
      }
    }
  };

  const orderColumns = [
    { title: '工单号', dataIndex: 'orderNumber', key: 'orderNumber', width: 140, render: (n: string) => <span style={{ fontWeight: 500 }}>{n}</span> },
    { title: '装置', dataIndex: 'deviceCode', key: 'deviceCode', width: 160, render: (c: string) => {
      const d = devices.find(x => x.code === c);
      return <div><div style={{ fontWeight: 500 }}>{d?.name || c}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{c}</div></div>;
    }},
    { title: '类型', dataIndex: 'workType', key: 'workType', width: 100 },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p: string) => {
      const pr = WORK_ORDER_PRIORITY[p];
      return <Tag color={pr?.color}>{pr?.label}</Tag>;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => {
      const st = WORK_ORDER_STATUS[s];
      return <Tag color={st?.color}>{st?.label}</Tag>;
    }},
    { title: '负责班组', dataIndex: 'assignedTeam', key: 'assignedTeam', width: 100, render: (t: string) => t || '-' },
    { title: '计划日期', dataIndex: 'plannedDate', key: 'plannedDate', width: 110, render: (d: string) => d || '-' },
    { title: '工时', dataIndex: 'laborHours', key: 'laborHours', width: 80, render: (h: number) => h ? `${h}h` : '-' },
    { title: '操作', key: 'action', width: 200, render: (_: any, r: MaintenanceWorkOrder) => (
      <Space size="small">
        <Button size="small" onClick={() => setDetailDrawer(r)}>详情</Button>
        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditOrder(r)}>编辑</Button>
        {r.status !== 'completed' && (
          <Button size="small" type="primary" onClick={() => completeOrder(r)}>完成</Button>
        )}
      </Space>
    )}
  ];

  const partColumns = [
    { title: '备件编号', dataIndex: 'code', key: 'code', width: 100 },
    { title: '备件名称', dataIndex: 'name', key: 'name', width: 160 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '库存', key: 'stock', width: 240, render: (_: any, r: SparePart) => (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: r.stock < r.safetyStock ? 600 : 400, color: r.stock < r.safetyStock ? '#ff4d4f' : '#262626' }}>
            {r.stock} {r.unit}
          </span>
          {r.stock < r.safetyStock && <Badge status="error" text="低库存" />}
          {r.stock >= r.safetyStock && r.stock < r.safetyStock * 1.2 && <Badge status="warning" text="预警" />}
        </div>
        <Progress
          percent={Math.min(100, (r.stock / (r.safetyStock * 2)) * 100)}
          size="small"
          strokeColor={r.stock < r.safetyStock ? '#ff4d4f' : r.stock < r.safetyStock * 1.2 ? '#faad14' : '#52c41a'}
          format={() => `安全库存: ${r.safetyStock}${r.unit}`}
        />
      </div>
    )},
    { title: '存放位置', dataIndex: 'location', key: 'location', width: 100 },
    { title: '单价', dataIndex: 'price', key: 'price', width: 100, render: (p: number) => `¥${p.toLocaleString()}` },
    { title: '操作', key: 'action', width: 120, render: (_: any, r: SparePart) => (
      <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPart(r)}>编辑</Button>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="待处理工单" value={pendingOrders.length} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="进行中工单" value={inProgressOrders.length} valueStyle={{ color: '#1677ff' }} prefix={<ToolOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="本月已完成" value={completedOrders.length} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="备件总数" value={spareParts.length} valueStyle={{ color: '#722ed1' }} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="低库存预警" value={lowStockParts.length} valueStyle={{ color: lowStockParts.length > 0 ? '#faad14' : '#52c41a' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="低于安全库存" value={criticalStockParts.length} valueStyle={{ color: criticalStockParts.length > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
      </Row>

      {criticalStockParts.length > 0 && (
        <Alert
          type="error"
          showIcon
          message={`有 ${criticalStockParts.length} 种备件库存低于安全库存，请及时采购！`}
          description={
            <Space wrap>
              {criticalStockParts.map(p => (
                <Tag key={p.code} color="red">{p.name}: {p.stock}/{p.safetyStock}{p.unit}</Tag>
              ))}
            </Space>
          }
          closable
        />
      )}

      <Card>
        <Tabs defaultActiveKey="orders">
          <TabPane tab="维保工单管理" key="orders">
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOrder}>创建工单</Button>
              <Button icon={<HistoryOutlined />} onClick={generateCycleWorkOrders}>生成周期维保工单</Button>
            </div>
            <Table
              rowKey="id"
              columns={orderColumns}
              dataSource={workOrders}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1100 }}
            />
          </TabPane>
          <TabPane tab="备件库存管理" key="parts">
            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPart}>添加备件</Button>
              <Button icon={<FileTextOutlined />}>导出库存清单</Button>
            </div>
            <Table
              rowKey="id"
              columns={partColumns}
              dataSource={spareParts}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 900 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingOrder ? '编辑维保工单' : '创建维保工单'}
        open={orderModalVisible}
        onOk={submitOrder}
        onCancel={() => setOrderModalVisible(false)}
        width={680}
        okText="保存"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="deviceCode" label="所属装置" rules={[{ required: true, message: '请选择装置' }]}>
                <Select placeholder="选择装置" showSearch>
                  {devices.map(d => <Option key={d.code} value={d.code}>{d.name} ({DEVICE_TYPES[d.type]})</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="workType" label="工单类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="预防性维护">预防性维护</Option>
                  <Option value="故障维修">故障维修</Option>
                  <Option value="大修">大修</Option>
                  <Option value="检查">检查</Option>
                  <Option value="改造">改造</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(WORK_ORDER_PRIORITY).map(([v, l]) => <Option key={v} value={v}>{l.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(WORK_ORDER_STATUS).map(([v, l]) => <Option key={v} value={v}>{l.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="工作描述" rules={[{ required: true, message: '请填写工作描述' }]}>
            <TextArea rows={3} placeholder="请详细描述维修工作内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignedTeam" label="负责班组">
                <Select placeholder="选择班组" allowClear>
                  <Option value="维修一班">维修一班</Option>
                  <Option value="维修二班">维修二班</Option>
                  <Option value="仪表班">仪表班</Option>
                  <Option value="电气班">电气班</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assignee" label="负责人">
                <Select placeholder="选择负责人" showSearch allowClear>
                  {employees.filter(e => e.department === '设备部').map(e => <Option key={e.code} value={e.name}>{e.name} ({e.position})</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="plannedDate" label="计划日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="laborHours" label="预计工时(h)" initialValue={0}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="spareParts" label="备件清单 (JSON格式)">
            <TextArea rows={2} placeholder='[{"code":"SP-001","name":"高温油泵密封件","quantity":2}]' />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingPart ? '编辑备件' : '添加备件'}
        open={partModalVisible}
        onOk={submitPart}
        onCancel={() => setPartModalVisible(false)}
        width={600}
        okText="保存"
      >
        <Form form={partForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="备件编号" rules={[{ required: true }]}>
                <Input placeholder="如: SP-009" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="备件名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                <Select>
                  <Option value="seal">密封件</Option>
                  <Option value="valve">阀门</Option>
                  <Option value="instrument">仪表</Option>
                  <Option value="pump">泵</Option>
                  <Option value="heat_exchanger">换热器</Option>
                  <Option value="catalyst">催化剂</Option>
                  <Option value="lubricant">润滑油</Option>
                  <Option value="coating">涂料</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="stock" label="当前库存" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="safetyStock" label="安全库存" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Select>
                  <Option value="个">个</Option>
                  <Option value="套">套</Option>
                  <Option value="支">支</Option>
                  <Option value="组">组</Option>
                  <Option value="kg">kg</Option>
                  <Option value="L">L</Option>
                  <Option value="桶">桶</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="location" label="存放位置" rules={[{ required: true }]}>
                <Input placeholder="如: A-01-01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="price" label="单价(元)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="生成周期维保工单"
        open={cycleModalVisible}
        onOk={confirmGenerateCycleWorkOrders}
        onCancel={() => { setCycleModalVisible(false); setCycleWorkOrders([]); }}
        width={900}
        okText="确认生成"
        cancelText="取消"
        okButtonProps={{ disabled: cycleWorkOrders.length === 0 }}
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message={`共检测到 ${cycleWorkOrders.length} 台装置需要周期维保`}
          description="根据装置运行时长自动计算，达到维保阈值90%的装置将列出"
        />
        <Table
          rowKey="deviceCode"
          size="small"
          columns={[
            { title: '装置', dataIndex: 'deviceName', key: 'deviceName', width: 160 },
            { title: '运行时长', dataIndex: 'runHours', key: 'runHours', width: 110, render: (h: number) => `${h.toFixed(0)}h` },
            { title: '维保阈值', dataIndex: 'threshold', key: 'threshold', width: 100, render: (h: number) => `${h}h` },
            { title: '超期时长', dataIndex: 'overdue', key: 'overdue', width: 100, render: (h: number) => h > 0 ? <Tag color="red">{h.toFixed(0)}h</Tag> : <Tag color="orange">即将到期</Tag> },
            { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, render: (p: string) => {
              const pr = WORK_ORDER_PRIORITY[p];
              return <Tag color={pr?.color}>{pr?.label}</Tag>;
            }},
            { title: '维保内容', dataIndex: 'description', key: 'description', ellipsis: true }
          ]}
          dataSource={cycleWorkOrders}
          pagination={false}
          scroll={{ y: 320 }}
          locale={{ emptyText: '暂无需要维保的装置' }}
        />
      </Modal>

      <Drawer
        title="工单详情"
        placement="right"
        width={520}
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
      >
        {detailDrawer && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="工单编号">{detailDrawer.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="装置">
                {devices.find(d => d.code === detailDrawer.deviceCode)?.name || detailDrawer.deviceCode}
              </Descriptions.Item>
              <Descriptions.Item label="类型">{detailDrawer.workType}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={WORK_ORDER_PRIORITY[detailDrawer.priority]?.color}>
                  {WORK_ORDER_PRIORITY[detailDrawer.priority]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={WORK_ORDER_STATUS[detailDrawer.status]?.color}>
                  {WORK_ORDER_STATUS[detailDrawer.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="负责班组">{detailDrawer.assignedTeam || '-'}</Descriptions.Item>
              <Descriptions.Item label="负责人">{detailDrawer.assignee || '-'}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{detailDrawer.plannedDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="完成日期">{detailDrawer.completedDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计工时">{detailDrawer.laborHours} 小时</Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">工作描述</Divider>
            <p style={{ lineHeight: 1.8 }}>{detailDrawer.description}</p>
            {detailDrawer.spareParts && (
              <>
                <Divider orientation="left">备件清单</Divider>
                <List
                  size="small"
                  bordered
                  dataSource={(() => {
                    try { return JSON.parse(detailDrawer.spareParts); } catch { return []; }
                  })()}
                  locale={{ emptyText: '无备件需求' }}
                  renderItem={(item: any) => (
                    <List.Item>
                      <span>{item.name || item.code}</span>
                      <span style={{ marginLeft: 'auto' }}>x{item.quantity}</span>
                    </List.Item>
                  )}
                />
              </>
            )}
            {detailDrawer.remarks && (
              <>
                <Divider orientation="left">备注</Divider>
                <p>{detailDrawer.remarks}</p>
              </>
            )}
            <Divider orientation="left">工单进度</Divider>
            <Timeline
              items={[
                { color: 'green', children: <div>工单创建<div style={{ color: '#8c8c8c', fontSize: 12 }}>{detailDrawer.createdAt ? dayjs(detailDrawer.createdAt).format('YYYY-MM-DD HH:mm') : detailDrawer.plannedDate || '-'}</div></div> },
                detailDrawer.status !== 'pending' && { color: 'blue', children: <div>开始处理<div style={{ color: '#8c8c8c', fontSize: 12 }}>{detailDrawer.assignee || '负责人'}</div></div> },
                detailDrawer.status === 'completed' && { color: 'green', children: <div>工单完成<div style={{ color: '#8c8c8c', fontSize: 12 }}>{detailDrawer.completedDate}</div></div> }
              ].filter(Boolean) as any}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default MaintenanceManagement;
