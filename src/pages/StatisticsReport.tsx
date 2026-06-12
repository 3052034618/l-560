import React, { useEffect, useState } from 'react';
import {
  Card, Table, Tag, Button, Select, DatePicker, Space, Row, Col, Statistic,
  Tabs, Progress, Tooltip, Divider, message, Dropdown
} from 'antd';
import {
  FileTextOutlined, DownloadOutlined, BarChartOutlined,
  LineChartOutlined, PieChartOutlined, ThunderboltOutlined,
  RiseOutlined, StockOutlined, TeamOutlined, CalendarOutlined,
  FireOutlined, PrinterOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { DEVICE_TYPES } from '@/utils/constants';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const StatisticsReport: React.FC = () => {
  const { devices, deviceStatuses, schedules, workOrders, employees, shifts, loadAll } = useAppStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')]);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  useEffect(() => {
    loadAll();
  }, []);

  const filteredSchedules = schedules.filter(s => {
    const date = dayjs(s.scheduleDate);
    return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
  });

  const filteredWorkOrders = workOrders.filter(w => {
    if (w.completedDate) {
      const date = dayjs(w.completedDate);
      return date.isAfter(dateRange[0]) && date.isBefore(dateRange[1]);
    }
    return true;
  });

  const totalPlannedOutput = filteredSchedules.reduce((sum, s) => sum + s.plannedOutput, 0);
  const totalActualOutput = filteredSchedules.reduce((sum, s) => sum + s.actualOutput, 0);
  const completionRate = totalPlannedOutput > 0 ? (totalActualOutput / totalPlannedOutput) * 100 : 0;
  const completedOrders = filteredWorkOrders.filter(w => w.status === 'completed').length;
  const totalLaborHours = filteredWorkOrders.reduce((sum, w) => sum + (w.laborHours || 0), 0);

  const deviceStats = devices.map(d => {
    const devSchedules = filteredSchedules.filter(s => s.deviceCode === d.code);
    const devStatus = deviceStatuses.find(s => s.deviceCode === d.code);
    const planned = devSchedules.reduce((sum, s) => sum + s.plannedOutput, 0);
    const actual = devSchedules.reduce((sum, s) => sum + s.actualOutput, 0);
    const utilization = d.designCapacity > 0 ? (actual / (d.designCapacity * 10000 * 0.85 / 365 * dateRange[1].diff(dateRange[0], 'day'))) * 100 : 0;
    return {
      ...d,
      planned,
      actual,
      completionRate: planned > 0 ? (actual / planned) * 100 : 0,
      utilization: Math.min(100, utilization),
      runHours: devStatus?.runHours || 0
    };
  });

  const energyConsumption = [
    { device: '常压蒸馏', value: 8.5, target: 9.0 },
    { device: '催化裂化', value: 12.3, target: 13.0 },
    { device: '加氢裂化', value: 15.8, target: 16.5 },
    { device: '加氢精制', value: 9.2, target: 10.0 },
    { device: '减压蒸馏', value: 7.8, target: 8.5 },
    { device: '延迟焦化', value: 18.5, target: 19.0 }
  ];

  const outputChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['计划产量', '实际产量'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: { type: 'category', data: Array.from({ length: Math.min(30, dateRange[1].diff(dateRange[0], 'day') + 1) }, (_, i) => dateRange[0].add(i, 'day').format('MM-DD')) },
    yAxis: { type: 'value', name: '吨' },
    series: [
      {
        name: '计划产量',
        type: 'bar',
        data: Array.from({ length: 30 }, () => Math.round(15000 + Math.random() * 6000)),
        itemStyle: { color: '#1677ff', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '实际产量',
        type: 'bar',
        data: Array.from({ length: 30 }, (_, i) => {
          const planned = 15000 + Math.random() * 6000;
          return Math.round(planned * (0.88 + Math.random() * 0.1));
        }),
        itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };

  const utilizationChartOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: deviceStats.filter(d => d.status === 'running').map(d => d.name.substring(0, 6)) },
    yAxis: { type: 'value', name: '%', max: 100 },
    series: [{
      type: 'bar',
      data: deviceStats.filter(d => d.status === 'running').map(d => ({
        value: Math.round(d.utilization * 10) / 10,
        itemStyle: {
          color: d.utilization >= 80 ? '#52c41a' : d.utilization >= 60 ? '#1677ff' : d.utilization >= 40 ? '#faad14' : '#ff4d4f',
          borderRadius: [4, 4, 0, 0]
        }
      })),
      label: { show: true, position: 'top', formatter: '{c}%' },
      barWidth: '50%'
    }]
  };

  const energyChartOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['实际能耗', '目标能耗'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: { type: 'category', data: energyConsumption.map(e => e.device) },
    yAxis: { type: 'value', name: 'kg标油/吨' },
    series: [
      {
        name: '实际能耗',
        type: 'line',
        smooth: true,
        data: energyConsumption.map(e => e.value),
        lineStyle: { color: '#1677ff', width: 3 },
        itemStyle: { color: '#1677ff' },
        symbol: 'circle',
        symbolSize: 10,
        areaStyle: { color: 'rgba(22,119,255,0.2)' }
      },
      {
        name: '目标能耗',
        type: 'line',
        smooth: true,
        data: energyConsumption.map(e => e.target),
        lineStyle: { color: '#ff4d4f', type: 'dashed', width: 2 },
        itemStyle: { color: '#ff4d4f' },
        symbol: 'diamond',
        symbolSize: 8
      }
    ]
  };

  const teamPerformanceOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', right: 10, top: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      data: [
        { value: employees.filter(e => e.department === '生产部').length, name: '生产部', itemStyle: { color: '#1677ff' } },
        { value: employees.filter(e => e.department === '设备部').length, name: '设备部', itemStyle: { color: '#52c41a' } },
        { value: employees.filter(e => e.department === '安全部').length, name: '安全部', itemStyle: { color: '#faad14' } },
        { value: employees.filter(e => e.department === '质量部').length, name: '质量部', itemStyle: { color: '#722ed1' } },
        { value: employees.filter(e => !['生产部', '设备部', '安全部', '质量部'].includes(e.department)).length, name: '其他', itemStyle: { color: '#8c8c8c' } }
      ],
      label: { formatter: '{b}\n{d}%' }
    }]
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('Refinery Production Monthly Report', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Period: ${dateRange[0].format('YYYY-MM-DD')} to ${dateRange[1].format('YYYY-MM-DD')}`, 105, 30, { align: 'center' });

      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [['Metric', 'Value', 'Target', 'Completion']],
        body: [
          ['Total Planned Output', `${totalPlannedOutput.toLocaleString()} tons`, '-', '-'],
          ['Total Actual Output', `${totalActualOutput.toLocaleString()} tons`, `${totalPlannedOutput.toLocaleString()} tons`, `${completionRate.toFixed(1)}%`],
          ['Completed Work Orders', `${completedOrders} orders`, '-', '-'],
          ['Total Labor Hours', `${totalLaborHours} hours`, '-', '-'],
          ['Active Devices', `${devices.filter(d => d.status === 'running').length}`, `${devices.length}`, `${(devices.filter(d => d.status === 'running').length / devices.length * 100).toFixed(0)}%`]
        ]
      });

      const finalY = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(14);
      doc.text('Device Performance', 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [['Device', 'Type', 'Planned', 'Actual', 'Completion', 'Utilization']],
        body: deviceStats.map(d => [
          d.name,
          DEVICE_TYPES[d.type] || d.type,
          `${d.planned.toLocaleString()}t`,
          `${d.actual.toLocaleString()}t`,
          `${d.completionRate.toFixed(1)}%`,
          `${d.utilization.toFixed(1)}%`
        ])
      });

      doc.save(`production-report-${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF报告已导出');
    } catch (e) {
      console.error(e);
      message.error('导出失败');
    }
  };

  const deviceColumns = [
    { title: '装置名称', dataIndex: 'name', key: 'name', width: 180, render: (n: string, r: any) => <div><div style={{ fontWeight: 500 }}>{n}</div><div style={{ color: '#8c8c8c', fontSize: 12 }}>{r.code}</div></div> },
    { title: '装置类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => DEVICE_TYPES[t] || t },
    { title: '计划产量', dataIndex: 'planned', key: 'planned', width: 120, render: (v: number) => `${v.toLocaleString()} 吨` },
    { title: '实际产量', dataIndex: 'actual', key: 'actual', width: 120, render: (v: number) => `${v.toLocaleString()} 吨` },
    { title: '完成率', key: 'completion', width: 160, render: (_: any, r: any) => (
      <div>
        <Progress percent={Math.round(r.completionRate)} size="small" status={r.completionRate >= 95 ? 'success' : r.completionRate >= 80 ? 'normal' : 'exception'} />
      </div>
    )},
    { title: '设备利用率', key: 'utilization', width: 160, render: (_: any, r: any) => (
      <div>
        <Progress percent={Math.round(r.utilization)} size="small" status={r.utilization >= 80 ? 'success' : r.utilization >= 60 ? 'normal' : 'exception'} />
      </div>
    )},
    { title: '累计运行', dataIndex: 'runHours', key: 'runHours', width: 100, render: (h: number) => `${h}h` }
  ];

  const energyColumns = [
    { title: '装置', dataIndex: 'device', key: 'device', width: 120 },
    { title: '实际能耗(kg标油/吨)', dataIndex: 'value', key: 'value', width: 160, render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: '目标能耗', dataIndex: 'target', key: 'target', width: 120 },
    { title: '节能量', key: 'saving', width: 120, render: (_: any, r: any) => {
      const saving = r.target - r.value;
      return <span style={{ color: saving > 0 ? '#52c41a' : '#ff4d4f' }}>{saving > 0 ? '+' : ''}{saving.toFixed(1)}</span>;
    }},
    { title: '节能率', key: 'rate', width: 160, render: (_: any, r: any) => {
      const rate = ((r.target - r.value) / r.target * 100);
      return <Progress percent={Math.round(rate)} size="small" status={rate > 0 ? 'success' : 'exception'} />;
    }}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <Space wrap>
            <span style={{ fontWeight: 500 }}>统计周期:</span>
            <RangePicker value={dateRange} onChange={(d) => d && d[0] && d[1] && setDateRange([d[0], d[1]])} />
            <Select value={selectedDevice} onChange={setSelectedDevice} style={{ width: 160 }}>
              <Option value="all">全部装置</Option>
              {devices.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
            </Select>
          </Space>
          <Space>
            <Button icon={<PrinterOutlined />}>打印</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportPDF}>导出PDF月度报告</Button>
          </Space>
        </div>
      </Card>

      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="计划总产量"
              value={totalPlannedOutput}
              suffix="吨"
              valueStyle={{ color: '#1677ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="实际总产量"
              value={totalActualOutput}
              suffix="吨"
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Progress percent={Math.round(completionRate)} size="small" status={completionRate >= 95 ? 'success' : 'normal'} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成工单"
              value={completedOrders}
              suffix="单"
              valueStyle={{ color: '#722ed1' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总工时投入"
              value={totalLaborHours}
              suffix="小时"
              valueStyle={{ color: '#fa8c16' }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs defaultActiveKey="output">
          <TabPane tab={<span><BarChartOutlined /> 产量统计</span>} key="output">
            <Row gutter={16}>
              <Col span={16}>
                <Card size="small" title="每日产量趋势">
                  <ReactECharts option={outputChartOption} style={{ height: 350 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="产量构成分析">
                  <ReactECharts option={{
                    tooltip: { trigger: 'item', formatter: '{b}: {c}吨 ({d}%)' },
                    legend: { bottom: 0 },
                    series: [{
                      type: 'pie',
                      radius: ['35%', '65%'],
                      center: ['50%', '45%'],
                      data: [
                        { value: 85000, name: '汽油', itemStyle: { color: '#1677ff' } },
                        { value: 62000, name: '柴油', itemStyle: { color: '#52c41a' } },
                        { value: 28000, name: '航煤', itemStyle: { color: '#722ed1' } },
                        { value: 18000, name: 'LPG', itemStyle: { color: '#fa8c16' } },
                        { value: 25000, name: '其他', itemStyle: { color: '#8c8c8c' } }
                      ]
                    }]
                  }} style={{ height: 350 }} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><ThunderboltOutlined /> 设备统计</span>} key="device">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Card size="small" title="设备利用率统计">
                  <ReactECharts option={utilizationChartOption} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>
            <Table
              rowKey="id"
              columns={deviceColumns}
              dataSource={deviceStats.filter(d => selectedDevice === 'all' || d.code === selectedDevice)}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane tab={<span><FireOutlined /> 能耗统计</span>} key="energy">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={16}>
                <Card size="small" title="综合能耗趋势（kg标油/吨）">
                  <ReactECharts option={energyChartOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="能源类型占比">
                  <ReactECharts option={{
                    tooltip: { trigger: 'item' },
                    legend: { bottom: 0 },
                    series: [{
                      type: 'pie',
                      radius: ['35%', '65%'],
                      center: ['50%', '45%'],
                      data: [
                        { value: 45, name: '燃料气', itemStyle: { color: '#ff4d4f' } },
                        { value: 28, name: '电力', itemStyle: { color: '#1677ff' } },
                        { value: 15, name: '蒸汽', itemStyle: { color: '#fa8c16' } },
                        { value: 12, name: '其他', itemStyle: { color: '#8c8c8c' } }
                      ],
                      label: { formatter: '{b}\n{d}%' }
                    }]
                  }} style={{ height: 300 }} />
                </Card>
              </Col>
            </Row>
            <Table
              rowKey="device"
              columns={energyColumns}
              dataSource={energyConsumption}
              pagination={false}
            />
          </TabPane>

          <TabPane tab={<span><TeamOutlined /> 人员绩效</span>} key="staff">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="部门人员分布">
                  <ReactECharts option={teamPerformanceOption} style={{ height: 320 }} />
                </Card>
              </Col>
              <Col span={16}>
                <Card size="small" title="班组产量排名">
                  <Table
                    rowKey="team"
                    columns={[
                      { title: '排名', key: 'rank', width: 80, render: (_: any, __: any, i: number) => <Tag color={i < 3 ? (i === 0 ? 'gold' : i === 1 ? 'silver' : 'orange') : 'default'}>{i + 1}</Tag> },
                      { title: '班组', dataIndex: 'team', key: 'team', width: 120 },
                      { title: '负责装置', dataIndex: 'devices', key: 'devices' },
                      { title: '班次次数', dataIndex: 'shifts', key: 'shifts', width: 100 },
                      { title: '产量完成率', key: 'rate', width: 200, render: (_: any, r: any) => <Progress percent={r.rate} size="small" status={r.rate >= 95 ? 'success' : 'normal'} /> },
                      { title: '综合评分', dataIndex: 'score', key: 'score', width: 100, render: (s: number) => <span style={{ fontWeight: 600, color: s >= 90 ? '#52c41a' : s >= 80 ? '#1677ff' : '#fa8c16' }}>{s}</span> }
                    ]}
                    dataSource={[
                      { team: '生产一班', devices: '常压1号, 催化1号', shifts: 62, rate: 98, score: 95 },
                      { team: '生产二班', devices: '加氢1号, 加氢2号', shifts: 58, rate: 96, score: 92 },
                      { team: '生产三班', devices: '减压1号, 焦化1号', shifts: 55, rate: 93, score: 88 },
                      { team: '维修一班', devices: '全厂设备', shifts: 48, rate: 91, score: 85 },
                      { team: '维修二班', devices: '仪表电气', shifts: 45, rate: 89, score: 82 }
                    ]}
                    pagination={false}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default StatisticsReport;
