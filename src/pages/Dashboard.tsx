import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, List, Alert, Badge, Tooltip } from 'antd';
import {
  ThunderboltOutlined, WarningOutlined, CheckCircleOutlined, ToolOutlined,
  RiseOutlined, FireOutlined, BarChartOutlined, TeamOutlined, AlertOutlined,
  EnvironmentOutlined, StockOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { DEVICE_STATUS, ALARM_LEVEL, HEALTH_STATUS, DEVICE_TYPES } from '@/utils/constants';

const Dashboard: React.FC = () => {
  const { devices, deviceStatuses, rawMaterials, schedules, alarms, workOrders, loadAll } = useAppStore();
  const [currentTime, setCurrentTime] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  useEffect(() => {
    loadAll();
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const runningDevices = devices.filter(d => d.status === 'running');
  const totalCapacity = runningDevices.reduce((sum, d) => sum + d.designCapacity, 0);
  const todaySchedules = schedules.filter(s => s.scheduleDate === dayjs().format('YYYY-MM-DD'));
  const totalPlannedOutput = todaySchedules.reduce((sum, s) => sum + s.plannedOutput, 0);
  const totalActualOutput = todaySchedules.reduce((sum, s) => sum + s.actualOutput, 0);
  const activeAlarms = alarms.filter(a => a.status === 'active');
  const pendingWorkOrders = workOrders.filter(w => w.status === 'pending' || w.status === 'in_progress');
  const lowStockMaterials = rawMaterials.filter(m => m.stock < m.safetyStock * 1.2);

  const outputChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['计划产量', '实际产量'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) => dayjs().subtract(6 - i, 'day').format('MM-DD'))
    },
    yAxis: { type: 'value', name: '吨' },
    series: [
      {
        name: '计划产量',
        type: 'bar',
        data: [18500, 19200, 18800, 20100, 19500, 19800, totalPlannedOutput || 19200],
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '实际产量',
        type: 'bar',
        data: [17850, 18920, 18650, 19800, 19200, 19650, totalActualOutput || 18200],
        itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };

  const deviceChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: devices.filter(d => d.status === 'running').length, name: '运行', itemStyle: { color: '#52c41a' } },
        { value: devices.filter(d => d.status === 'idle').length, name: '待机', itemStyle: { color: '#8c8c8c' } },
        { value: devices.filter(d => d.status === 'maintenance').length, name: '检修', itemStyle: { color: '#faad14' } },
        { value: devices.filter(d => d.status === 'fault').length, name: '故障', itemStyle: { color: '#ff4d4f' } }
      ]
    }]
  };

  const energyChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['常压', '催化', '加氢', '减压', '焦化'] },
    yAxis: { type: 'value', name: 'kg标油/吨' },
    series: [{
      type: 'line',
      smooth: true,
      data: [8.5, 12.3, 15.8, 9.2, 18.5],
      areaStyle: { color: 'rgba(22,119,255,0.2)' },
      lineStyle: { color: '#1677ff', width: 2 },
      itemStyle: { color: '#1677ff' },
      symbol: 'circle',
      symbolSize: 8
    }]
  };

  const deviceStatusColumns = [
    { title: '装置', dataIndex: 'name', key: 'name', width: 150, render: (n: string, r: any) => <div><div style={{ fontWeight: 500 }}>{n}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.code}</div></div> },
    { title: '温度(℃)', dataIndex: 'temperature', key: 'temperature', width: 100, render: (v: number, r: any) => {
      const d = devices.find(x => x.code === r.deviceCode);
      const isHigh = d && v > d.temperatureMax * 0.95;
      return <span style={{ color: isHigh ? '#ff4d4f' : '#262626', fontWeight: isHigh ? 600 : 400 }}>{v?.toFixed(1) || '-'}</span>;
    }},
    { title: '压力(MPa)', dataIndex: 'pressure', key: 'pressure', width: 100, render: (v: number) => v?.toFixed(2) || '-' },
    { title: '液位(%)', dataIndex: 'level', key: 'level', width: 120, render: (v: number) => v !== undefined ? <Progress percent={Math.round(v)} size="small" /> : '-' },
    { title: '状态', dataIndex: 'healthStatus', key: 'healthStatus', width: 80, render: (s: string) => {
      const hs = HEALTH_STATUS[s];
      return <Tag color={hs?.color}>{hs?.label || s}</Tag>;
    }}
  ];

  const deviceStatusData = deviceStatuses.map(s => {
    const d = devices.find(x => x.code === s.deviceCode);
    return { ...s, name: d?.name, status: d?.status };
  }).filter(s => s.status === 'running');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {activeAlarms.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined className="alarm-flash" style={{ fontSize: 20 }} />}
          message={`当前有 ${activeAlarms.length} 个活动报警，请及时处理！`}
          description={
            <List
              size="small"
              dataSource={activeAlarms.slice(0, 3)}
              renderItem={(a) => (
                <List.Item>
                  <Tag color={ALARM_LEVEL[a.alarmLevel]?.color}>{ALARM_LEVEL[a.alarmLevel]?.label}</Tag>
                  <span style={{ fontWeight: 500 }}>[{a.deviceCode}]</span> {a.message}
                  <span style={{ marginLeft: 'auto', color: '#8c8c8c', fontSize: 12 }}>{dayjs(a.createdAt).format('HH:mm:ss')}</span>
                </List.Item>
              )}
            />
          }
          closable
        />
      )}

      <Row gutter={16}>
        <Col span={4}>
          <Card>
            <Statistic title="当前时间" value={currentTime} valueStyle={{ fontSize: 16, color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="运行装置"
              value={runningDevices.length}
              suffix={`/ ${devices.length}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="今日产量"
              value={totalActualOutput}
              suffix="吨"
              valueStyle={{ color: '#1677ff' }}
              prefix={<RiseOutlined />}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
              完成 {totalPlannedOutput > 0 ? ((totalActualOutput / totalPlannedOutput) * 100).toFixed(1) : 0}%
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="运行产能"
              value={totalCapacity}
              suffix="万吨/年"
              valueStyle={{ color: '#722ed1' }}
              prefix={<FireOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理报警"
              value={activeAlarms.length}
              valueStyle={{ color: activeAlarms.length > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="待处理工单"
              value={pendingWorkOrders.length}
              valueStyle={{ color: pendingWorkOrders.length > 2 ? '#faad14' : '#1677ff' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="近7天产量统计" extra={<BarChartOutlined />}>
            <ReactECharts option={outputChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="装置运行状态" extra={<ThunderboltOutlined />}>
            <ReactECharts option={deviceChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="运行装置实时数据" extra={<EnvironmentOutlined />}>
            <Table
              rowKey="deviceCode"
              size="small"
              columns={deviceStatusColumns}
              dataSource={deviceStatusData}
              pagination={false}
              scroll={{ y: 260 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="综合能耗" size="small" extra={<StockOutlined />}>
                <ReactECharts option={energyChartOption} style={{ height: 180 }} />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card title="库存预警" size="small" extra={<StockOutlined />}>
                <List
                  size="small"
                  dataSource={lowStockMaterials}
                  locale={{ emptyText: '无库存预警' }}
                  renderItem={(m) => (
                    <List.Item>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500 }}>{m.name}</span>
                          <Tooltip title={m.stock < m.safetyStock ? '低于安全库存' : '库存偏低'}>
                            <Badge status={m.stock < m.safetyStock ? 'error' : 'warning'} />
                          </Tooltip>
                        </div>
                        <Progress
                          percent={Math.round((m.stock / (m.safetyStock * 2)) * 100)}
                          size="small"
                          strokeColor={m.stock < m.safetyStock ? '#ff4d4f' : '#faad14'}
                          format={() => `${m.stock}${m.unit} / 安全${m.safetyStock}${m.unit}`}
                        />
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="今日排产计划" extra={<Tag color="blue">{todaySchedules.length} 条</Tag>}>
            <List
              size="small"
              dataSource={todaySchedules}
              locale={{ emptyText: '暂无排产计划' }}
              renderItem={(s) => {
                const d = devices.find(x => x.code === s.deviceCode);
                return (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <Tag color={s.shift === '白班' ? 'blue' : 'purple'}>{s.shift}</Tag>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{d?.name || s.deviceCode}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>{s.product} · {s.startTime}-{s.endTime}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: '#1677ff' }}>{s.actualOutput}/{s.plannedOutput}吨</div>
                        <Progress percent={Math.round((s.actualOutput / s.plannedOutput) * 100)} size="small" style={{ width: 100 }} />
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="维保工单动态" extra={<Tag color="orange">{pendingWorkOrders.length} 待处理</Tag>}>
            <List
              size="small"
              dataSource={workOrders.slice(0, 6)}
              locale={{ emptyText: '暂无工单' }}
              renderItem={(w) => {
                const d = devices.find(x => x.code === w.deviceCode);
                return (
                  <List.Item>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <Tag color={w.status === 'completed' ? 'green' : w.status === 'in_progress' ? 'blue' : 'orange'}>
                        {w.status === 'completed' ? '已完成' : w.status === 'in_progress' ? '进行中' : '待处理'}
                      </Tag>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{w.orderNumber} - {d?.name || w.deviceCode}</div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>{w.description.substring(0, 30)}...</div>
                      </div>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>{w.assignedTeam || '未分配'}</div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
