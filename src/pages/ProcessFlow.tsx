import React, { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Tag, Tooltip, Slider, Progress, Badge, List, Space, Button, Statistic, Alert } from 'antd';
import {
  ThunderboltOutlined, WarningOutlined, CheckCircleOutlined,
  DashboardOutlined, FireOutlined, ExperimentOutlined,
  EnvironmentOutlined, PlayCircleOutlined, PauseCircleOutlined
} from '@ant-design/icons';
import * as echarts from 'echarts';
import { useAppStore } from '@/store/appStore';
import { DEVICE_TYPES, HEALTH_STATUS } from '@/utils/constants';

interface ProcessUnit {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  deviceCode?: string;
}

const ProcessFlow: React.FC = () => {
  const { devices, deviceStatuses, rawMaterials, alarms, loadAll } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<ProcessUnit | null>(null);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) {
      chartRef.current.dispose();
    }
    chartRef.current = echarts.init(canvasRef.current);
    renderFlowChart();
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
    };
  }, [devices, deviceStatuses]);

  const getUnitColor = (type: string, healthStatus: string) => {
    if (healthStatus === 'critical' || healthStatus === 'warning') {
      return healthStatus === 'critical' ? '#ff4d4f' : '#faad14';
    }
    const colors: Record<string, string> = {
      atmospheric: '#1677ff',
      catalytic_cracking: '#722ed1',
      hydrocracking: '#52c41a',
      hydrotreating: '#13c2c2',
      vacuum_distillation: '#eb2f96',
      delayed_coking: '#fa8c16',
      storage: '#8c8c8c',
      utility: '#1890ff'
    };
    return colors[type] || '#8c8c8c';
  };

  const renderFlowChart = () => {
    if (!chartRef.current) return;

    const nodes: any[] = [];
    const links: any[] = [];

    const processUnits: ProcessUnit[] = [
      { id: 'storage-crude', name: '原油储罐区', type: 'storage', x: 50, y: 250, width: 100, height: 80 },
      { id: 'CDU-001', name: '常压蒸馏1号', type: 'atmospheric', x: 220, y: 150, width: 120, height: 100, deviceCode: 'CDU-001' },
      { id: 'CDU-002', name: '常压蒸馏2号', type: 'atmospheric', x: 220, y: 350, width: 120, height: 100, deviceCode: 'CDU-002' },
      { id: 'VR-001', name: '减压蒸馏', type: 'vacuum_distillation', x: 400, y: 250, width: 120, height: 100, deviceCode: 'VR-001' },
      { id: 'FCC-001', name: '催化裂化1号', type: 'catalytic_cracking', x: 580, y: 100, width: 120, height: 100, deviceCode: 'FCC-001' },
      { id: 'FCC-002', name: '催化裂化2号', type: 'catalytic_cracking', x: 580, y: 250, width: 120, height: 100, deviceCode: 'FCC-002' },
      { id: 'HDT-001', name: '加氢裂化', type: 'hydrocracking', x: 580, y: 400, width: 120, height: 100, deviceCode: 'HDT-001' },
      { id: 'HDT-002', name: '加氢精制', type: 'hydrotreating', x: 760, y: 150, width: 120, height: 100, deviceCode: 'HDT-002' },
      { id: 'DEL-001', name: '延迟焦化', type: 'delayed_coking', x: 760, y: 350, width: 120, height: 100, deviceCode: 'DEL-001' },
      { id: 'H2-plant', name: '制氢装置', type: 'utility', x: 940, y: 100, width: 100, height: 80 },
      { id: 'storage-product', name: '成品油罐区', type: 'storage', x: 940, y: 280, width: 100, height: 120 },
      { id: 'utility', name: '公用工程', type: 'utility', x: 940, y: 450, width: 100, height: 60 }
    ];

    const connections = [
      ['storage-crude', 'CDU-001'],
      ['storage-crude', 'CDU-002'],
      ['CDU-001', 'VR-001'],
      ['CDU-002', 'VR-001'],
      ['VR-001', 'FCC-001'],
      ['VR-001', 'FCC-002'],
      ['VR-001', 'HDT-001'],
      ['VR-001', 'DEL-001'],
      ['FCC-001', 'HDT-002'],
      ['FCC-002', 'HDT-002'],
      ['HDT-001', 'storage-product'],
      ['HDT-002', 'storage-product'],
      ['DEL-001', 'storage-product'],
      ['CDU-001', 'storage-product'],
      ['CDU-002', 'storage-product'],
      ['H2-plant', 'HDT-001'],
      ['H2-plant', 'HDT-002'],
      ['utility', 'CDU-001'],
      ['utility', 'FCC-001'],
      ['utility', 'HDT-001']
    ];

    processUnits.forEach(unit => {
      const device = unit.deviceCode ? devices.find(d => d.code === unit.deviceCode) : null;
      const status = unit.deviceCode ? deviceStatuses.find(s => s.deviceCode === unit.deviceCode) : null;
      const isRunning = device?.status === 'running';
      const deviceAlarms = unit.deviceCode ? alarms.filter(a => a.deviceCode === unit.deviceCode && a.status === 'active') : [];
      const healthStatus = status?.healthStatus || (isRunning ? 'normal' : 'idle');

      nodes.push({
        id: unit.id,
        name: unit.name,
        x: unit.x,
        y: unit.y,
        symbolSize: [unit.width, unit.height],
        symbol: 'roundRect',
        itemStyle: {
          color: getUnitColor(unit.type, healthStatus),
          borderColor: deviceAlarms.length > 0 ? '#ff4d4f' : '#fff',
          borderWidth: deviceAlarms.length > 0 ? 3 : 2,
          shadowBlur: isRunning && animationEnabled ? 15 : 0,
          shadowColor: getUnitColor(unit.type, healthStatus),
          opacity: isRunning ? 1 : 0.6
        },
        label: {
          show: true,
          formatter: `{b|${unit.name}}\n${status ? `{a|${status.temperature.toFixed(0)}℃ ${status.pressure.toFixed(2)}MPa}` : '{a|' + (device?.status === 'maintenance' ? '检修中' : '待机') + '}'}`,
          position: 'inside',
          fontSize: 12,
          color: '#fff',
          lineHeight: 18,
          rich: {
            b: { fontSize: 13, fontWeight: 'bold', color: '#fff', lineHeight: 20 },
            a: { fontSize: 11, color: 'rgba(255,255,255,0.9)' }
          }
        },
        _unitData: { ...unit, device, status, healthStatus, alarmCount: deviceAlarms.length }
      });
    });

    connections.forEach(([from, to]) => {
      const fromUnit = processUnits.find(u => u.id === from);
      const toUnit = processUnits.find(u => u.id === to);
      if (fromUnit && toUnit) {
        links.push({
          source: from,
          target: to,
          lineStyle: {
            color: '#1677ff',
            width: 2,
            opacity: 0.6,
            curveness: 0.1
          },
          effect: animationEnabled ? {
            show: true,
            period: 4,
            trailLength: 0.4,
            symbol: 'arrow',
            symbolSize: 8,
            color: '#52c41a'
          } : undefined
        });
      }
    });

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node' && params.data._unitData) {
            const d = params.data._unitData;
            const healthLabel = HEALTH_STATUS[d.healthStatus];
            return `
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${d.name}</div>
              <div>类型: ${DEVICE_TYPES[d.type] || d.type}</div>
              ${d.device ? `
                <div>状态: ${d.device.status === 'running' ? '运行中' : d.device.status === 'maintenance' ? '检修中' : '待机'}</div>
                ${d.status ? `
                  <div>温度: ${d.status.temperature.toFixed(1)} ℃</div>
                  <div>压力: ${d.status.pressure.toFixed(2)} MPa</div>
                  <div>液位: ${d.status.level.toFixed(1)} %</div>
                  <div>运行: ${d.status.runHours} 小时</div>
                ` : ''}
                <div style="margin-top: 4px; color: ${healthLabel?.color === 'red' ? '#ff4d4f' : healthLabel?.color === 'orange' ? '#faad14' : '#52c41a'}">
                  健康: ${healthLabel?.label}
                </div>
                ${d.alarmCount > 0 ? `<div style="color: #ff4d4f">报警: ${d.alarmCount} 个</div>` : ''}
              ` : ''}
            `;
          }
          return params.name || '';
        }
      },
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { show: false, min: 0, max: 1100 },
      yAxis: { show: false, min: 0, max: 550, inverse: true },
      series: [{
        type: 'graph',
        layout: 'none',
        coordinateSystem: 'cartesian2d',
        roam: true,
        draggable: true,
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 }
        }
      }]
    };

    chartRef.current.setOption(option);
    chartRef.current.off('click');
    chartRef.current.on('click', (params: any) => {
      if (params.dataType === 'node' && params.data._unitData) {
        setSelectedUnit(params.data._unitData);
      }
    });
  };

  const activeAlarms = alarms.filter(a => a.status === 'active');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row gutter={16}>
        <Col span={18}>
          <Card
            title="炼化工艺流程图 - 实时运行状态"
            extra={
              <Space>
                <Tooltip title={animationEnabled ? '暂停动画' : '启动动画'}>
                  <Button
                    icon={animationEnabled ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={() => setAnimationEnabled(!animationEnabled)}
                  >
                    {animationEnabled ? '暂停动画' : '启动动画'}
                  </Button>
                </Tooltip>
                <Tag icon={<EnvironmentOutlined />} color="blue">点击装置查看详情</Tag>
              </Space>
            }
            style={{ height: 620 }}
          >
            <div ref={canvasRef} style={{ width: '100%', height: 560, background: 'linear-gradient(135deg, #001529 0%, #002140 100%)', borderRadius: 8 }} />
          </Card>
        </Col>
        <Col span={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: 620 }}>
            <Card title="实时报警" size="small" extra={<Badge count={activeAlarms.length} />} style={{ flex: 1 }}>
              <List
                size="small"
                dataSource={activeAlarms.slice(0, 5)}
                locale={{ emptyText: '暂无活动报警' }}
                renderItem={(a) => (
                  <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Tag color={a.alarmLevel === 'critical' ? 'red' : a.alarmLevel === 'warning' ? 'orange' : 'blue'} style={{ margin: 0 }}>
                          {a.alarmLevel === 'critical' ? '严重' : a.alarmLevel === 'warning' ? '警告' : '提示'}
                        </Tag>
                        <span style={{ fontSize: 11, color: '#8c8c8c' }}>{a.deviceCode}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#595959', lineHeight: 1.4 }}>{a.message}</div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="原料库存" size="small" style={{ flex: 1 }}>
              <List
                size="small"
                dataSource={rawMaterials.slice(0, 5)}
                renderItem={(m) => (
                  <List.Item style={{ padding: '8px 0' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontWeight: 500, fontSize: 12 }}>{m.name}</span>
                        {m.stock < m.safetyStock && <Badge status="error" />}
                        {m.stock >= m.safetyStock && m.stock < m.safetyStock * 1.2 && <Badge status="warning" />}
                      </div>
                      <Progress
                        percent={Math.min(100, (m.stock / (m.safetyStock * 2)) * 100)}
                        size="small"
                        strokeColor={m.stock < m.safetyStock ? '#ff4d4f' : m.stock < m.safetyStock * 1.2 ? '#faad14' : '#52c41a'}
                        format={() => `${m.stock.toLocaleString()}${m.unit}`}
                      />
                    </div>
                  </List.Item>
                )}
              />
            </Card>

            <Card title="图例说明" size="small">
              <Space wrap size={[8, 8]}>
                <Tag color="#1677ff">常压蒸馏</Tag>
                <Tag color="#722ed1">催化裂化</Tag>
                <Tag color="#52c41a">加氢裂化</Tag>
                <Tag color="#13c2c2">加氢精制</Tag>
                <Tag color="#eb2f96">减压蒸馏</Tag>
                <Tag color="#fa8c16">延迟焦化</Tag>
                <Tag color="#8c8c8c">储罐/公用</Tag>
              </Space>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" size="small" style={{ fontSize: 12 }}>
                <div><Badge status="success" /> 正常运行</div>
                <div><Badge status="warning" /> 参数预警</div>
                <div><Badge status="error" /> 报警/超阈值</div>
                <div><Badge status="default" /> 待机/检修</div>
              </Space>
            </Card>
          </div>
        </Col>
      </Row>

      {selectedUnit && selectedUnit.device && (
        <Card
          title={`${selectedUnit.name} - 详细状态监控`}
          extra={<Tag color={HEALTH_STATUS[selectedUnit.healthStatus || 'normal']?.color}>{HEALTH_STATUS[selectedUnit.healthStatus || 'normal']?.label}</Tag>}
        >
          <Row gutter={24}>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="装置状态"
                  value={selectedUnit.device.status === 'running' ? '运行中' : selectedUnit.device.status === 'maintenance' ? '检修中' : '待机'}
                  valueStyle={{ fontSize: 16, color: selectedUnit.device.status === 'running' ? '#52c41a' : selectedUnit.device.status === 'maintenance' ? '#faad14' : '#8c8c8c' }}
                  prefix={selectedUnit.device.status === 'running' ? <CheckCircleOutlined /> : <WarningOutlined />}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic title="反应温度" value={selectedUnit.status?.temperature.toFixed(1)} suffix="℃" prefix={<FireOutlined style={{ color: '#ff4d4f' }} />} />
                <Progress
                  percent={Math.min(100, selectedUnit.status ? ((selectedUnit.status.temperature - selectedUnit.device.temperatureMin) / (selectedUnit.device.temperatureMax - selectedUnit.device.temperatureMin)) * 100 : 0)}
                  size="small"
                  strokeColor="#ff4d4f"
                  style={{ marginTop: 8 }}
                />
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>安全范围: {selectedUnit.device.temperatureMin}-{selectedUnit.device.temperatureMax}℃</div>
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic title="系统压力" value={selectedUnit.status?.pressure.toFixed(2)} suffix="MPa" prefix={<DashboardOutlined style={{ color: '#1677ff' }} />} />
                <Progress
                  percent={Math.min(100, selectedUnit.status ? ((selectedUnit.status.pressure - selectedUnit.device.pressureMin) / (selectedUnit.device.pressureMax - selectedUnit.device.pressureMin)) * 100 : 0)}
                  size="small"
                  strokeColor="#1677ff"
                  style={{ marginTop: 8 }}
                />
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>安全范围: {selectedUnit.device.pressureMin}-{selectedUnit.device.pressureMax}MPa</div>
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic title="液位" value={selectedUnit.status?.level.toFixed(1)} suffix="%" prefix={<ExperimentOutlined style={{ color: '#52c41a' }} />} />
                <Progress
                  percent={Math.round(selectedUnit.status?.level || 0)}
                  size="small"
                  strokeColor="#52c41a"
                  style={{ marginTop: 8 }}
                />
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>正常范围: 30%-80%</div>
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic title="运行时长" value={selectedUnit.status?.runHours || 0} suffix="小时" prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />} />
                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 12 }}>
                  设计产能: {selectedUnit.device.designCapacity} 万吨/年
                </div>
              </Card>
            </Col>
          </Row>

          {selectedUnit.description && (
            <Alert
              type="info"
              showIcon
              message="装置信息"
              description={selectedUnit.description}
              style={{ marginTop: 16 }}
            />
          )}

          <Card title="温度热力分布趋势" size="small" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '16px 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>温度梯度分布 (入口 → 反应区 → 出口)</div>
                <div style={{
                  height: 40,
                  borderRadius: 8,
                  background: selectedUnit.status ? `linear-gradient(90deg,
                    hsl(${(selectedUnit.status.temperature / selectedUnit.device.temperatureMax) * 60}, 80%, 60%) 0%,
                    hsl(${(selectedUnit.status.temperature / selectedUnit.device.temperatureMax) * 40}, 90%, 55%) 30%,
                    hsl(0, 90%, ${Math.max(30, 70 - (selectedUnit.status.temperature - selectedUnit.device.temperatureMin) / (selectedUnit.device.temperatureMax - selectedUnit.device.temperatureMin) * 40)}%) 60%,
                    hsl(20, 85%, ${Math.max(25, 65 - (selectedUnit.status.temperature - selectedUnit.device.temperatureMin) / (selectedUnit.device.temperatureMax - selectedUnit.device.temperatureMin) * 40)}%) 100%
                  )` : 'linear-gradient(90deg, #52c41a 0%, #1677ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  color: '#fff',
                  fontWeight: 600,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                }}>
                  <span>入口 {selectedUnit.status ? (selectedUnit.status.temperature * 0.7).toFixed(0) : '-'}℃</span>
                  <span>反应区 {selectedUnit.status ? selectedUnit.status.temperature.toFixed(0) : '-'}℃</span>
                  <span>出口 {selectedUnit.status ? (selectedUnit.status.temperature * 0.85).toFixed(0) : '-'}℃</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#8c8c8c' }}>
              <span>冷区 (低温)</span>
              <span>温区 (中温)</span>
              <span>热区 (高温)</span>
              <span>超温预警区</span>
            </div>
          </Card>
        </Card>
      )}
    </div>
  );
};

export default ProcessFlow;
