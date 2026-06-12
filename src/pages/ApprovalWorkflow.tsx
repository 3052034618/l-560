import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Select, Input, Space, message, Tabs, Timeline, Avatar, Descriptions, Row, Col, Statistic, Popconfirm, Divider } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  SafetyCertificateOutlined, UserOutlined, CommentOutlined,
  ThunderboltOutlined, EditOutlined, SendOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore, ProductionScheduleItem } from '@/store/appStore';
import { DEVICE_TYPES, SCHEDULE_STATUS } from '@/utils/constants';

const { TextArea } = Input;
const { TabPane } = Tabs;

const ApprovalWorkflow: React.FC = () => {
  const { devices, schedules, loadAll, saveSchedule } = useAppStore();
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ProductionScheduleItem | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | 'adjust' | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAll();
  }, []);

  const pendingList = schedules.filter(s => s.status === 'pending_approval');
  const adjustingList = schedules.filter(s => s.status === 'adjusting');
  const approvedList = schedules.filter(s => s.status === 'approved').slice(0, 10);
  const rejectedList = schedules.filter(s => s.status === 'rejected').slice(0, 10);

  const handleAction = (schedule: ProductionScheduleItem, action: 'approve' | 'reject' | 'adjust') => {
    setSelectedSchedule(schedule);
    setActionModal(action);
    form.resetFields();
  };

  const submitAction = async () => {
    if (!selectedSchedule || !actionModal) return;
    try {
      const values = await form.validateFields();
      const newStatus = actionModal === 'approve' ? 'approved' : actionModal === 'reject' ? 'rejected' : 'adjusting';
      await saveSchedule({
        ...selectedSchedule,
        status: newStatus,
        notes: values.comments ? (selectedSchedule.notes || '') + `\n【${actionModal === 'approve' ? '审批通过' : actionModal === 'reject' ? '审批驳回' : '申请调整'}】${values.comments}` : selectedSchedule.notes
      });
      message.success(actionModal === 'approve' ? '已批准，方案已推送至中控室' : actionModal === 'reject' ? '已驳回' : '已申请调整，待主管审批');
      setActionModal(null);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmByOperator = async (schedule: ProductionScheduleItem) => {
    try {
      await saveSchedule({ ...schedule, status: 'completed' });
      message.success('已确认排产方案');
      loadAll();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const getColumns = (showActions: boolean, showConfirm: boolean = false) => [
    { title: '日期', dataIndex: 'scheduleDate', key: 'scheduleDate', width: 110, render: (d: string) => dayjs(d).format('YYYY-MM-DD') },
    { title: '班次', dataIndex: 'shift', key: 'shift', width: 70, render: (s: string) => <Tag color={s === '白班' ? 'blue' : 'purple'}>{s}</Tag> },
    { title: '装置', dataIndex: 'deviceCode', key: 'deviceCode', width: 160, render: (c: string) => {
      const d = devices.find(x => x.code === c);
      return <div><div style={{ fontWeight: 500 }}>{d?.name || c}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{c}</div></div>;
    }},
    { title: '产品方案', dataIndex: 'product', key: 'product', width: 160 },
    { title: '产量', key: 'output', width: 140, render: (_: any, r: any) => `${r.actualOutput}/${r.plannedOutput} 吨` },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => {
      const st = SCHEDULE_STATUS[s];
      return <Tag color={st?.color}>{st?.label || s}</Tag>;
    }},
    {
      title: '操作', key: 'action', width: showConfirm ? 240 : 200, fixed: 'right' as const,
      render: (_: any, r: ProductionScheduleItem) => (
        <Space size="small">
          <Button size="small" onClick={() => { setSelectedSchedule(r); setDetailVisible(true); }}>详情</Button>
          {showActions && r.status === 'pending_approval' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAction(r, 'approve')}>批准</Button>
              <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleAction(r, 'reject')}>驳回</Button>
            </>
          )}
          {showActions && r.status === 'adjusting' && (
            <Button size="small" type="primary" icon={<SafetyCertificateOutlined />} onClick={() => handleAction(r, 'approve')}>审批调整</Button>
          )}
          {showConfirm && r.status === 'approved' && (
            <>
              <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleConfirmByOperator(r)}>确认执行</Button>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleAction(r, 'adjust')}>申请调整</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const actionTitle = actionModal === 'approve' ? '批准排产方案' : actionModal === 'reject' ? '驳回排产方案' : '申请调整排产方案';
  const actionOkText = actionModal === 'approve' ? '批准并推送' : actionModal === 'reject' ? '确认驳回' : '提交调整申请';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="待审批方案" value={pendingList.length} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="调整申请中" value={adjustingList.length} valueStyle={{ color: '#1677ff' }} prefix={<EditOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已批准方案" value={approvedList.length} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="已驳回方案" value={rejectedList.length} valueStyle={{ color: '#ff4d4f' }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="pending">
          <TabPane tab={`生产主管审批 (${pendingList.length})`} key="pending">
            <Table
              rowKey="id"
              columns={getColumns(true)}
              dataSource={pendingList}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1000 }}
              locale={{ emptyText: '暂无待审批的方案' }}
            />
          </TabPane>
          <TabPane tab="中控室操作员确认" key="operator">
            <Table
              rowKey="id"
              columns={getColumns(false, true)}
              dataSource={schedules.filter(s => s.status === 'approved' || s.status === 'completed')}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
          <TabPane tab="调整申请审批" key="adjusting">
            <Table
              rowKey="id"
              columns={getColumns(true)}
              dataSource={adjustingList}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1000 }}
              locale={{ emptyText: '暂无调整申请' }}
            />
          </TabPane>
          <TabPane tab="已完成记录" key="history">
            <Table
              rowKey="id"
              columns={getColumns(false)}
              dataSource={[...approvedList, ...rejectedList]}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={actionTitle}
        open={!!actionModal}
        onOk={submitAction}
        onCancel={() => setActionModal(null)}
        okText={actionOkText}
        okButtonProps={{ type: actionModal === 'reject' ? 'primary' : 'primary', danger: actionModal === 'reject' }}
        width={560}
      >
        {selectedSchedule && (
          <div>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="装置">{devices.find(d => d.code === selectedSchedule.deviceCode)?.name}</Descriptions.Item>
              <Descriptions.Item label="班次">{selectedSchedule.shift}</Descriptions.Item>
              <Descriptions.Item label="产品">{selectedSchedule.product}</Descriptions.Item>
              <Descriptions.Item label="计划产量">{selectedSchedule.plannedOutput} 吨</Descriptions.Item>
            </Descriptions>
            <Form form={form} layout="vertical">
              <Form.Item
                name="comments"
                label={actionModal === 'approve' ? '审批意见（可选）' : actionModal === 'reject' ? '驳回原因' : '调整说明'}
                rules={actionModal !== 'approve' ? [{ required: true, message: '请填写' }] : []}
              >
                <TextArea rows={3} placeholder={actionModal === 'reject' ? '请说明驳回原因' : actionModal === 'adjust' ? '请详细说明调整内容和原因' : '请输入审批意见'} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="排产方案详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={680}
      >
        {selectedSchedule && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="排产日期">{selectedSchedule.scheduleDate}</Descriptions.Item>
              <Descriptions.Item label="班次">{selectedSchedule.shift}</Descriptions.Item>
              <Descriptions.Item label="装置">{devices.find(d => d.code === selectedSchedule.deviceCode)?.name}</Descriptions.Item>
              <Descriptions.Item label="装置编号">{selectedSchedule.deviceCode}</Descriptions.Item>
              <Descriptions.Item label="产品方案">{selectedSchedule.product}</Descriptions.Item>
              <Descriptions.Item label="原料">{selectedSchedule.rawMaterials || '-'}</Descriptions.Item>
              <Descriptions.Item label="计划产量">{selectedSchedule.plannedOutput} 吨</Descriptions.Item>
              <Descriptions.Item label="实际产量">{selectedSchedule.actualOutput} 吨</Descriptions.Item>
              <Descriptions.Item label="开始时间">{selectedSchedule.startTime}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{selectedSchedule.endTime}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                <Tag color={SCHEDULE_STATUS[selectedSchedule.status]?.color}>
                  {SCHEDULE_STATUS[selectedSchedule.status]?.label}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">审批轨迹</Divider>
            <Timeline
              items={[
                { color: 'blue', children: <div><b>方案创建</b><div style={{ color: '#8c8c8c', fontSize: 12 }}>{dayjs(selectedSchedule.createdAt).format('YYYY-MM-DD HH:mm')}</div></div> },
                selectedSchedule.status !== 'pending_approval' && {
                  color: selectedSchedule.status === 'approved' || selectedSchedule.status === 'completed' ? 'green' : 'red',
                  children: (
                    <div>
                      <b>{selectedSchedule.status === 'approved' || selectedSchedule.status === 'completed' ? '生产主管审批通过' : '审批驳回'}</b>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>张建国 · {dayjs(selectedSchedule.updatedAt).format('YYYY-MM-DD HH:mm')}</div>
                    </div>
                  )
                },
                selectedSchedule.status === 'completed' && {
                  color: 'green',
                  children: <div><b>中控室确认执行</b><div style={{ color: '#8c8c8c', fontSize: 12 }}>李志强 · 操作员确认</div></div>
                }
              ].filter(Boolean) as any}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalWorkflow;
