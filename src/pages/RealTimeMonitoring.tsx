import React, { useEffect, useState, useRef } from 'react';
import { Card, Table, Tag, Button, Modal, Form, Input, Select, Space, message, Row, Col, Statistic, Progress, Alert, Badge, Tooltip, Divider, Empty, Descriptions } from 'antd';
import {
  WarningOutlined, BellOutlined, SafetyOutlined, ThunderboltOutlined,
  CheckCircleOutlined, SoundOutlined, DashboardOutlined, FireOutlined,
  ExperimentOutlined, AlertOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore, Alarm } from '@/store/appStore';
import { DEVICE_TYPES, ALARM_LEVEL, HEALTH_STATUS } from '@/utils/constants';

const { Option } = Select;

interface MonitorDataPoint {
  time: string;
  value: number;
}

const RealTimeMonitoring: React.FC = () => {
  const { devices, deviceStatuses, alarms, loadAll, saveAlarm } = useAppStore();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<Record<string, MonitorDataPoint[]>>({});
  const [acknowledgeModal, setAcknowledgeModal] = useState<Alarm | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [form] = Form.useForm();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const initializedRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      await loadAll();
      if (!initializedRef.current) {
        initHistoryData();
        initializedRef.current = true;
      }
    };
    init();
    intervalRef.current = setInterval(() => {
      simulateDataUpdate();
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const initHistoryData = () => {
    const initData: Record<string, MonitorDataPoint[]> = {};
    const now = dayjs();
    deviceStatuses.forEach(st => {
      ['temperature', 'pressure', 'level'].forEach(param => {
        const key = `${st.deviceCode}-${param}`;
        initData[key] = Array.from({ length: 20 }, (_, i) => ({
          time: now.subtract(19 - i, 'minute').format('HH:mm'),
          value: param === 'temperature' ? st.temperature + (Math.random() - 0.5) * 10 :
                 param === 'pressure' ? st.pressure + (Math.random() - 0.5) * 0.05 :
                 st.level + (Math.random() - 0.5) * 5
        }));
      });
    });
    setHistoryData(initData);
  };

  const simulateDataUpdate = async () => {
    const pendingAlarms: Alarm[] = [];
    const interlockRecords: string[] = [];

    setHistoryData(prev => {
      const newData = { ...prev };
      const now = dayjs().format('HH:mm');
      deviceStatuses.forEach(st => {
        ['temperature', 'pressure', 'level'].forEach(param => {
          const key = `${st.deviceCode}-${param}`;
          if (newData[key]) {
            const lastVal = newData[key][newData[key].length - 1]?.value || 0;
            const delta = param === 'temperature' ? (Math.random() - 0.5) * 4 :
                          param === 'pressure' ? (Math.random() - 0.5) * 0.02 :
                          (Math.random() - 0.5) * 2;
            let newVal = lastVal + delta;
            const device = devices.find(d => d.code === st.deviceCode);
            if (device) {
              if (param === 'temperature') {
                if (Math.random() < 0.1) newVal = device.temperatureMax * 1.08;
                newVal = Math.max(device.temperatureMin * 0.8, Math.min(device.temperatureMax * 1.15, newVal));
              }
              if (param === 'pressure') {
                if (Math.random() < 0.08) newVal = device.pressureMax * 1.08;
                newVal = Math.max(0, Math.min(device.pressureMax * 1.15, newVal));
              }
              if (param === 'level') {
                newVal = Math.max(0, Math.min(100, newVal));
              }
            }
            newData[key] = [...newData[key].slice(1), { time: now, value: newVal }];

            if (device) {
              let threshold: number | null = null;
              let isOverLimit = false;
              let direction: 'high' | 'low' | null = null;

              if (param === 'temperature') {
                if (newVal > device.temperatureMax) {
                  threshold = device.temperatureMax;
                  isOverLimit = true;
                  direction = 'high';
                } else if (newVal < device.temperatureMin) {
                  threshold = device.temperatureMin;
                  isOverLimit = true;
                  direction = 'low';
                }
              } else if (param === 'pressure') {
                if (newVal > device.pressureMax) {
                  threshold = device.pressureMax;
                  isOverLimit = true;
                  direction = 'high';
                } else if (newVal < device.pressureMin) {
                  threshold = device.pressureMin;
                  isOverLimit = true;
                  direction = 'low';
                }
              } else if (param === 'level') {
                if (newVal > 90) {
                  threshold = 90;
                  isOverLimit = true;
                  direction = 'high';
                } else if (newVal < 20) {
                  threshold = 20;
                  isOverLimit = true;
                  direction = 'low';
                }
              }

              if (isOverLimit && threshold !== null) {
                const paramLabels: Record<string, string> = {
                  temperature: '温度',
                  pressure: '压力',
                  level: '液位'
                };
                const existingActiveAlarm = alarms.find(a =>
                  a.deviceCode === st.deviceCode &&
                  (a.parameterKey === param || a.parameter === paramLabels[param]) &&
                  a.status === 'active'
                );
                if (!existingActiveAlarm) {
                  const paramUnits: Record<string, string> = {
                    temperature: '°C',
                    pressure: 'MPa',
                    level: '%'
                  };
                  const exceedRatio = Math.abs((newVal - threshold) / threshold);
                  const alarmLevel = exceedRatio > 0.08 ? 'critical' : 'warning';
                  const directionStr = direction === 'high' ? '超高' : '超低';
                  const message = `${device.name}${paramLabels[param]}${directionStr}报警: 当前${newVal.toFixed(1)}${paramUnits[param]}, 阈值${threshold}${paramUnits[param]}`;

                  let actionType = '';
                  let actionDetail = '';

                  if (alarmLevel === 'critical') {
                    if (param === 'temperature' && direction === 'high') {
                      actionType = 'interlock_shutdown';
                      actionDetail = `【联锁停车】${device.name}温度严重超高(${newVal.toFixed(1)}°C)，已触发联锁停车保护系统，切断进料，开启紧急冷却`;
                    } else if (param === 'pressure' && direction === 'high') {
                      actionType = 'pressure_relief';
                      actionDetail = `【泄压动作】${device.name}压力严重超高(${newVal.toFixed(2)}MPa)，已自动打开紧急泄压阀，压力正在回落`;
                    } else if (param === 'level' && direction === 'high') {
                      actionType = 'valve_adjust';
                      actionDetail = `【阀门调节】${device.name}液位严重超高(${newVal.toFixed(1)}%)，已自动关小进料阀，开大出料阀`;
                    } else if (param === 'temperature' && direction === 'low') {
                      actionType = 'heating_increase';
                      actionDetail = `【加热调节】${device.name}温度严重偏低(${newVal.toFixed(1)}°C)，已自动增大加热燃料气流量`;
                    } else if (param === 'pressure' && direction === 'low') {
                      actionType = 'pressure_increase';
                      actionDetail = `【增压动作】${device.name}压力严重偏低(${newVal.toFixed(2)}MPa)，已自动启动增压泵`;
                    } else if (param === 'level' && direction === 'low') {
                      actionType = 'valve_adjust';
                      actionDetail = `【阀门调节】${device.name}液位严重偏低(${newVal.toFixed(1)}%)，已自动开大进料阀`;
                    }
                    interlockRecords.push(actionDetail);
                  }

                  const newAlarm: Alarm = {
                    deviceCode: st.deviceCode,
                    alarmCode: `ALM-${dayjs().format('YYYYMMDDHHmmss')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                    alarmLevel,
                    parameter: paramLabels[param],
                    parameterKey: param,
                    thresholdValue: `${threshold}${paramUnits[param]}`,
                    actualValue: newVal,
                    message,
                    status: 'active',
                    actionType,
                    actionDetail,
                    createdAt: new Date().toISOString()
                  };

                  pendingAlarms.push(newAlarm);
                }
              }
            }
          }
        });
      });
      return newData;
    });

    if (pendingAlarms.length > 0) {
      try {
        for (const alarm of pendingAlarms) {
          await saveAlarm(alarm);
        }
        if (soundEnabled) {
          const criticalCount = pendingAlarms.filter(a => a.alarmLevel === 'critical').length;
          if (criticalCount > 0) {
            message.error(`检测到 ${criticalCount} 条严重报警！${interlockRecords.join('; ')}`);
          } else {
            message.warning(`检测到 ${pendingAlarms.length} 条新报警`);
          }
        }
        await loadAll();
      } catch (e) {
        console.error('保存报警失败', e);
      }
    }
  };

  const activeAlarms = alarms.filter(a => a.status === 'active');
  const criticalAlarms = activeAlarms.filter(a => a.alarmLevel === 'critical');

  const getTrendChartOption = (deviceCode: string, param: string, label: string, min: number, max: number, unit: string) => {
    const data = historyData[`${deviceCode}-${param}`] || [];
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 30, containLabel: true },
      xAxis: { type: 'category', data: data.map(d => d.time), axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', name: unit, min: min * 0.8, max: max * 1.1 },
      series: [{
        type: 'line',
        smooth: true,
        data: data.map(d => Number(d.value.toFixed(2))),
        lineStyle: { color: param === 'temperature' ? '#ff4d4f' : param === 'pressure' ? '#1677ff' : '#52c41a', width: 2 },
        itemStyle: { color: param === 'temperature' ? '#ff4d4f' : param === 'pressure' ? '#1677ff' : '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: param === 'temperature' ? 'rgba(255,77,79,0.3)' : param === 'pressure' ? 'rgba(22,119,255,0.3)' : 'rgba(82,196,26,0.3)' },
              { offset: 1, color: 'rgba(255,255,255,0)' }
            ]
          }
        },
        markLine: {
          silent: true,
          data: [
            { yAxis: min, lineStyle: { color: '#faad14', type: 'dashed' }, label: { formatter: '下限', fontSize: 10 } },
            { yAxis: max, lineStyle: { color: '#ff4d4f', type: 'dashed' }, label: { formatter: '上限', fontSize: 10 } }
          ]
        }
      }]
    };
  };

  const handleAcknowledge = async () => {
    if (!acknowledgeModal) return;
    try {
      const values = await form.validateFields();
      await saveAlarm({
        ...acknowledgeModal,
        status: 'acknowledged',
        acknowledgedBy: '张建国',
        acknowledgedAt: new Date().toISOString(),
        actionTaken: values.action
      });
      message.success('报警已确认');
      setAcknowledgeModal(null);
      loadAll();
    } catch (e) {
      console.error(e);
    }
  };

  const runningDevices = devices.filter(d => d.status === 'running');

  const alarmColumns = [
    { title: '级别', dataIndex: 'alarmLevel', key: 'alarmLevel', width: 80, render: (l: string) => {
      const al = ALARM_LEVEL[l];
      return <Tag color={al?.color} icon={l === 'critical' ? <AlertOutlined className="alarm-flash" /> : <WarningOutlined />}>{al?.label}</Tag>;
    }},
    { title: '装置', dataIndex: 'deviceCode', key: 'deviceCode', width: 120, render: (c: string) => {
      const d = devices.find(x => x.code === c);
      return <span style={{ fontWeight: 500 }}>{d?.name || c}</span>;
    }},
    { title: '参数', dataIndex: 'parameter', key: 'parameter', width: 100 },
    { title: '阈值', dataIndex: 'thresholdValue', key: 'thresholdValue', width: 80 },
    { title: '实际值', dataIndex: 'actualValue', key: 'actualValue', width: 80, render: (v: number, r: any) => <span style={{ color: r.alarmLevel === 'critical' ? '#ff4d4f' : '#faad14', fontWeight: 600 }}>{typeof v === 'number' ? v.toFixed(1) : v}</span> },
    { title: '联锁动作', dataIndex: 'actionType', key: 'actionType', width: 90, render: (t: string, r: Alarm) => r.alarmLevel === 'critical' && r.actionDetail ? <Badge status="error" text="已联锁" /> : '-' },
    { title: '报警信息', dataIndex: 'message', key: 'message', ellipsis: true },
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 120, render: (t: string) => dayjs(t).format('HH:mm:ss') },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (s: string) => s === 'active' ? <Badge status="error" text={<span className="alarm-flash">活动</span>} /> : <Tag color="default">已确认</Tag> },
    { title: '操作', key: 'action', width: 140, render: (_: any, r: Alarm) => (
      <Space size="small">
        {r.status === 'active' && <Button size="small" type="primary" onClick={() => { setAcknowledgeModal(r); form.resetFields(); }}>确认处理</Button>}
        <Button size="small" onClick={() => setAcknowledgeModal(r)}>详情</Button>
      </Space>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {criticalAlarms.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined className="alarm-flash" style={{ fontSize: 24 }} />}
          message={<span className="alarm-flash" style={{ fontWeight: 600, fontSize: 16 }}>严重报警！请立即处理！</span>}
          description={
            <div>
              {criticalAlarms.map(a => (
                <div key={a.id} style={{ marginBottom: 4 }}>
                  <Tag color="red">严重</Tag>
                  <b>[{a.deviceCode}]</b> {a.message}
                </div>
              ))}
            </div>
          }
          closable
          banner
        />
      )}

      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="活动报警" value={activeAlarms.length} valueStyle={{ color: activeAlarms.length > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<BellOutlined className={activeAlarms.length > 0 ? 'alarm-flash' : ''} />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="严重报警" value={criticalAlarms.length} valueStyle={{ color: criticalAlarms.length > 0 ? '#ff4d4f' : '#52c41a' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="预警装置" value={deviceStatuses.filter(s => s.healthStatus === 'warning').length} valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="运行装置" value={runningDevices.length} valueStyle={{ color: '#52c41a' }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic title="安全联锁" value="正常" valueStyle={{ color: '#52c41a', fontSize: 18 }} prefix={<SafetyOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Button
              type={soundEnabled ? 'primary' : 'default'}
              icon={<SoundOutlined />}
              block
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? '报警声音：开' : '报警声音：关'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Card title="装置运行概览" extra={<span style={{ color: '#8c8c8c' }}>点击装置查看详细趋势</span>}>
        <Row gutter={[16, 16]}>
          {runningDevices.map(device => {
            const status = deviceStatuses.find(s => s.deviceCode === device.code);
            const isSelected = selectedDevice === device.code;
            const isWarning = status?.healthStatus === 'warning';
            return (
              <Col span={6} key={device.code}>
                <Card
                  hoverable
                  onClick={() => setSelectedDevice(isSelected ? null : device.code)}
                  style={{
                    borderColor: isSelected ? '#1677ff' : isWarning ? '#faad14' : undefined,
                    borderWidth: isSelected || isWarning ? 2 : 1,
                    boxShadow: isSelected ? '0 2px 8px rgba(22,119,255,0.2)' : undefined
                  }}
                  size="small"
                  title={
                    <Space>
                      <ThunderboltOutlined style={{ color: '#52c41a' }} />
                      {device.name}
                      {isWarning && <Badge status="warning" />}
                    </Space>
                  }
                  extra={<Tag color={DEVICE_TYPES[device.type] ? 'blue' : 'default'} style={{ fontSize: 11 }}>{DEVICE_TYPES[device.type]}</Tag>}
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>温度</div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: status && status.temperature > device.temperatureMax * 0.95 ? '#ff4d4f' : '#262626' }}>
                        {status?.temperature.toFixed(1)}<span style={{ fontSize: 12 }}>℃</span>
                      </div>
                      <Progress
                        percent={Math.min(100, status ? ((status.temperature - device.temperatureMin) / (device.temperatureMax - device.temperatureMin)) * 100 : 0)}
                        size="small"
                        showInfo={false}
                        strokeColor={status && status.temperature > device.temperatureMax * 0.95 ? '#ff4d4f' : '#52c41a'}
                        style={{ marginTop: 4 }}
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>压力</div>
                      <div style={{ fontSize: 18, fontWeight: 600 }}>
                        {status?.pressure.toFixed(2)}<span style={{ fontSize: 12 }}>MPa</span>
                      </div>
                      <Progress
                        percent={Math.min(100, status ? ((status.pressure - device.pressureMin) / (device.pressureMax - device.pressureMin)) * 100 : 0)}
                        size="small"
                        showInfo={false}
                        strokeColor="#1677ff"
                        style={{ marginTop: 4 }}
                      />
                    </Col>
                  </Row>
                  <Divider style={{ margin: '8px 0' }} />
                  <Row gutter={8}>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>液位</div>
                      <Progress percent={Math.round(status?.level || 0)} size="small" />
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 12, color: '#8c8c8c' }}>运行</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{status?.runHours || 0}h</div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {selectedDevice && (() => {
        const device = devices.find(d => d.code === selectedDevice);
        const status = deviceStatuses.find(s => s.deviceCode === selectedDevice);
        if (!device) return null;
        return (
          <Card title={`${device.name} - 实时趋势监测`} extra={<Tag color={HEALTH_STATUS[status?.healthStatus || 'normal']?.color}>{HEALTH_STATUS[status?.healthStatus || 'normal']?.label}</Tag>}>
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title={<span><FireOutlined style={{ color: '#ff4d4f' }} /> 反应温度</span>} extra={<span style={{ fontSize: 18, fontWeight: 600, color: '#ff4d4f' }}>{status?.temperature.toFixed(1)} ℃</span>}>
                  <ReactECharts option={getTrendChartOption(selectedDevice, 'temperature', '温度', device.temperatureMin, device.temperatureMax, '℃')} style={{ height: 180 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title={<span><DashboardOutlined style={{ color: '#1677ff' }} /> 系统压力</span>} extra={<span style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>{status?.pressure.toFixed(2)} MPa</span>}>
                  <ReactECharts option={getTrendChartOption(selectedDevice, 'pressure', '压力', device.pressureMin, device.pressureMax, 'MPa')} style={{ height: 180 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title={<span><ExperimentOutlined style={{ color: '#52c41a' }} /> 液位</span>} extra={<span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>{status?.level.toFixed(1)} %</span>}>
                  <ReactECharts option={getTrendChartOption(selectedDevice, 'level', '液位', 0, 100, '%')} style={{ height: 180 }} />
                </Card>
              </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="进料流量" value={status?.flowRate || 0} suffix="吨/时" />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="当前产量" value={status?.currentOutput || 0} suffix="吨/时" />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="安全温度范围" value={`${device.temperatureMin} - ${device.temperatureMax}`} suffix="℃" valueStyle={{ fontSize: 16 }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="安全压力范围" value={`${device.pressureMin} - ${device.pressureMax}`} suffix="MPa" valueStyle={{ fontSize: 16 }} />
                </Card>
              </Col>
            </Row>
            <Alert
              type="info"
              showIcon
              style={{ marginTop: 16 }}
              message="自动控制策略"
              description="当前温度、压力在安全范围内，自动调节系统运行正常。如参数超阈值，将自动联动调节阀门；超临界值触发联锁停车保护。"
            />
          </Card>
        );
      })()}

      <Card title="报警管理" extra={<Tag color="red">实时更新</Tag>}>
        <Table
          rowKey="id"
          columns={alarmColumns}
          dataSource={alarms.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={acknowledgeModal?.status === 'active' ? '确认报警处理' : '报警详情'}
        open={!!acknowledgeModal}
        onOk={acknowledgeModal?.status === 'active' ? handleAcknowledge : () => setAcknowledgeModal(null)}
        onCancel={() => setAcknowledgeModal(null)}
        okText={acknowledgeModal?.status === 'active' ? '确认处理' : '关闭'}
        cancelText="关闭"
        width={560}
        footer={acknowledgeModal?.status === 'active' ? undefined : [
          <Button key="close" onClick={() => setAcknowledgeModal(null)}>关闭</Button>
        ]}
      >
        {acknowledgeModal && (
          <div>
            <Alert
              type={acknowledgeModal.alarmLevel === 'critical' ? 'error' : 'warning'}
              showIcon
              message={acknowledgeModal.message}
              style={{ marginBottom: 16 }}
            />
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="装置">{devices.find(d => d.code === acknowledgeModal.deviceCode)?.name || acknowledgeModal.deviceCode}</Descriptions.Item>
              <Descriptions.Item label="参数">{acknowledgeModal.parameter}</Descriptions.Item>
              <Descriptions.Item label="阈值">{acknowledgeModal.thresholdValue}</Descriptions.Item>
              <Descriptions.Item label="实际值">{typeof acknowledgeModal.actualValue === 'number' ? acknowledgeModal.actualValue.toFixed(1) : acknowledgeModal.actualValue}</Descriptions.Item>
              <Descriptions.Item label="报警时间">{dayjs(acknowledgeModal.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {acknowledgeModal.status === 'active' ? <Badge status="error" text="活动" /> : <Tag color="default">已确认</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {acknowledgeModal.actionDetail && (
              <>
                <Divider orientation="left" style={{ margin: '8px 0' }}>自动联锁动作</Divider>
                <Alert
                  type={acknowledgeModal.alarmLevel === 'critical' ? 'error' : 'warning'}
                  showIcon
                  icon={acknowledgeModal.actionType === 'interlock_shutdown' ? <CloseCircleOutlined /> : <SafetyOutlined />}
                  message={acknowledgeModal.actionType === 'interlock_shutdown' ? '联锁停车' :
                           acknowledgeModal.actionType === 'pressure_relief' ? '泄压动作' :
                           acknowledgeModal.actionType === 'valve_adjust' ? '阀门调节' : '自动调节'}
                  description={acknowledgeModal.actionDetail}
                  style={{ marginBottom: 16 }}
                />
              </>
            )}

            {acknowledgeModal.status === 'acknowledged' && (
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="确认人">{acknowledgeModal.acknowledgedBy || '-'}</Descriptions.Item>
                <Descriptions.Item label="确认时间">{acknowledgeModal.acknowledgedAt ? dayjs(acknowledgeModal.acknowledgedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
                <Descriptions.Item label="处理措施">{acknowledgeModal.actionTaken || '-'}</Descriptions.Item>
              </Descriptions>
            )}

            {acknowledgeModal.status === 'active' && (
              <Form form={form} layout="vertical">
                <Form.Item name="action" label="处理措施" rules={[{ required: true, message: '请填写处理措施' }]}>
                  <Input.TextArea rows={3} placeholder="请描述已采取的处理措施" />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RealTimeMonitoring;
