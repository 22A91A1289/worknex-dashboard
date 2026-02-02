import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  IoStatsChartOutline, 
  IoBriefcaseOutline, 
  IoDocumentTextOutline, 
  IoPersonOutline,
  IoCardOutline,
  IoLogOutOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline
} from 'react-icons/io5';
import './Layout.css';
import { clearAuth } from '../services/api';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    clearAuth();
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: IoStatsChartOutline },
    { path: '/jobs', label: 'Jobs', icon: IoBriefcaseOutline },
    { path: '/applications', label: 'Applications', icon: IoDocumentTextOutline },
    { path: '/payments', label: 'Payments', icon: IoCardOutline },
    { path: '/profile', label: 'Profile', icon: IoPersonOutline },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>WORKNEX</h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <IoChevronBackOutline /> : <IoChevronForwardOutline />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <IconComponent className="nav-icon" />
                {isSidebarOpen && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <IoLogOutOutline className="logout-icon" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
