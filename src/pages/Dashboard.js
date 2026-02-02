import React, { useState, useEffect } from 'react';
import { 
  IoBriefcaseOutline, 
  IoPeopleOutline
} from 'react-icons/io5';
import './Dashboard.css';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { label: 'Active Jobs', value: '0', icon: IoBriefcaseOutline, color: '#4F46E5' },
    { label: 'Applications', value: '0', icon: IoPeopleOutline, color: '#10B981' },
  ]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  
  // Connect to socket for real-time updates
  const { on, off } = useSocket(user._id, 'owner');

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time event listeners
    const handleJobCreated = (data) => {
      console.log('Real-time: Job created', data);
      showNotification('New job posted!', 'success');
      loadDashboardData(); // Reload data
    };

    const handleJobUpdated = (data) => {
      console.log('Real-time: Job updated', data);
      loadDashboardData(); // Reload data
    };

    const handleJobDeleted = (data) => {
      console.log('Real-time: Job deleted', data);
      showNotification('Job deleted', 'info');
      loadDashboardData(); // Reload data
    };

    const handleNewApplication = (data) => {
      console.log('Real-time: New application', data);
      showNotification(`New application received for ${data.application.job?.title}!`, 'success');
      loadDashboardData(); // Reload data
    };

    const handleApplicationUpdated = (data) => {
      console.log('Real-time: Application updated', data);
      loadDashboardData(); // Reload data
    };

    // Register event listeners
    on('job:created', handleJobCreated);
    on('job:updated', handleJobUpdated);
    on('job:deleted', handleJobDeleted);
    on('application:new', handleNewApplication);
    on('application:updated', handleApplicationUpdated);

    // Clean up event listeners on unmount
    return () => {
      off('job:created', handleJobCreated);
      off('job:updated', handleJobUpdated);
      off('job:deleted', handleJobDeleted);
      off('application:new', handleNewApplication);
      off('application:updated', handleApplicationUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load jobs and applications in parallel
      const [jobs, applications] = await Promise.all([
        api.get('/api/jobs/owner/my-jobs', { auth: true }),
        api.get('/api/applications/owner/all', { auth: true }).catch(() => [])
      ]);
      
      if (jobs && Array.isArray(jobs)) {
        const activeJobs = jobs.filter(job => job.status === 'active');
        
        // Use actual applications count from database (more accurate)
        const totalApplications = applications?.length || 0;
        
        // Update stats
        setStats([
          { label: 'Active Jobs', value: activeJobs.length.toString(), icon: IoBriefcaseOutline, color: '#4F46E5' },
          { label: 'Applications', value: totalApplications.toString(), icon: IoPeopleOutline, color: '#10B981' },
        ]);

        // Transform jobs for display
        const transformedJobs = activeJobs.slice(0, 6).map(job => ({
          id: job._id,
          title: job.title,
          category: job.category,
          location: job.location,
          applicants: applications?.filter(app => app.job?._id === job._id).length || 0,
          status: job.status,
          posted: job.createdAt ? getTimeAgo(new Date(job.createdAt)) : 'Recently',
          salary: job.salary,
        }));
        
        setRecentJobs(transformedJobs);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="dashboard">
      {/* Real-time Notification Toast */}
      {notification && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : '#3B82F6',
            color: 'white',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            zIndex: 9999,
            animation: 'slideInRight 0.3s ease-out',
            fontWeight: 500
          }}
        >
          {notification.message}
        </div>
      )}
      
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your jobs.</p>
      </div>

      {/* Stats Grid - Matching Mobile App */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                <IconComponent />
              </div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Jobs - From Backend */}
      <div className="card">
        <div className="card-header">
          <h2>Your Posted Jobs</h2>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
            Jobs posted here appear in the mobile app for workers
          </p>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>Loading jobs...</p>
          </div>
        ) : recentJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p>No jobs posted yet. Create your first job!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                <tr key={job.id}>
                  <td className="job-title-cell">
                    <div className="job-title-main">{job.title}</div>
                    <div className="job-category">{job.category}</div>
                  </td>
                  <td>{job.location}</td>
                  <td className="salary-cell">{job.salary}</td>
                  <td>{job.applicants}</td>
                  <td>
                    <span className={`status-badge ${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{job.posted}</td>
                  <td>
                    <button className="btn-link">View</button>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
