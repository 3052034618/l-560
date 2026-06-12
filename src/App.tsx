import React, { useState } from 'react';
import { Layout, Menu, Avatar, Badge } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  ScheduleOutlined,
  SafetyCertificateOutlined,
  MonitorOutlined,
  ToolOutlined,
  TeamOutlined,
  FileTextOutlined,
  BgColorsOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import ProductionSchedule from './pages/ProductionSchedule';
import ApprovalWorkflow from './pages/ApprovalWorkflow';
import RealTimeMonitoring from './pages/RealTimeMonitoring';
import MaintenanceManagement from './pages/MaintenanceManagement';
import StaffScheduling from './pages/StaffScheduling';
import StatisticsReport from './pages/StatisticsReport';
import ProcessFlow from './pages/ProcessFlow';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: 'dashboard', icon: <DashboardOutlined />, label: '总览看板' },
  { key: 'device', icon: <ThunderboltOutlined />, label: '装置信息管理' },
  { key: 'schedule', icon: <ScheduleOutlined />, label: '智能排产' },
  { key: 'approval', icon: <SafetyCertificateOutlined />, label: '审批流程' },
  { key: 'monitoring', icon: <MonitorOutlined />, label: '实时监测报警' },
  { key: 'maintenance', icon: <ToolOutlined />, label: '设备维保库存' },
  { key: 'staff', icon: <TeamOutlined />, label: '人员排班管理' },
  { key: 'statistics', icon: <FileTextOutlined />, label: '统计报告' },
  { key: 'process', icon: <BgColorsOutlined />, label: '工艺流程图' }
];

const App: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard': return <Dashboard />;
      case 'device': return <DeviceManagement />;
      case 'schedule': return <ProductionSchedule />;
      case 'approval': return <ApprovalWorkflow />;
      case 'monitoring': return <RealTimeMonitoring />;
      case 'maintenance': return <MaintenanceManagement />;
      case 'staff': return <StaffScheduling />;
      case 'statistics': return <StatisticsReport />;
      case 'process': return <ProcessFlow />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        style={{
          background: '#001529',
          overflow: 'auto',
          height: '100vh',
          position: 'sticky',
          top: 0,
          left: 0
        }}
      >
        <div style={{
          height: 64,
          margin: 16,
          background: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 16,
          fontWeight: 600,
          letterSpacing: 1
        }}>
          {collapsed ? '炼化' : '炼化调度系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#001529' }}>
            {menuItems.find(m => m.key === selectedKey)?.label as string}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Badge count={3} size="small">
              <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#595959' }} />
            </Badge>
            <SettingOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#595959' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
              <span style={{ color: '#262626' }}>张建国（生产主管）</span>
            </div>
          </div>
        </Header>
        <Content style={{ margin: 0, minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
          <div style={{ padding: 24 }}>
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
