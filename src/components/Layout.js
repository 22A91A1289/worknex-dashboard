import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  IoStatsChartOutline, 
  IoBriefcaseOutline, 
  IoDocumentTextOutline, 
  IoPersonOutline,
  IoCardOutline,
  IoLogOutOutline,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoMenuOutline,
  IoCloseOutline
} from 'react-icons/io5';
import './Layout.scss';
import { clearAuth } from '../services/api';
import socketService from '../services/socket';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = () => {
    socketService.disconnect();
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
      {/* Mobile Top Header */}
      {isMobile && (
        <header className="mobile-header">
          <div className="logo">WORKNEX</div>
          <button 
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <IoCloseOutline size={28} /> : <IoMenuOutline size={28} />}
          </button>
        </header>
      )}

      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        {!isMobile && (
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
        )}
        
        {isMobile && (
          <div className="sidebar-header mobile-only">
             <h2>WORKNEX</h2>
          </div>
        )}

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
                {(isSidebarOpen || isMobile) && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <IoLogOutOutline className="logout-icon" />
            {(isSidebarOpen || isMobile) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${isSidebarOpen && !isMobile ? 'shifted' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
