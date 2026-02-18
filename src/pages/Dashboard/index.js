// import React, { useState, useEffect, useCallback } from 'react';
// import { 
//   IoBriefcaseOutline, 
//   IoPeopleOutline
// } from 'react-icons/io5';
// import './Dashboard.css';
// import { api } from '../services/api';
// import { useSocket } from '../hooks/useSocket';

// const Dashboard = () => {
//   const [stats, setStats] = useState([
//     { label: 'Active Jobs', value: '0', icon: IoBriefcaseOutline, color: '#4F46E5' },
//     { label: 'Applications', value: '0', icon: IoPeopleOutline, color: '#10B981' },
//   ]);
//   const [recentJobs, setRecentJobs] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [notification, setNotification] = useState(null);
//   const [connectionError, setConnectionError] = useState(null);

//   // Get user from localStorage (API returns id, not _id)
//   const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  
//   // Connect to socket for real-time updates
//   const userId = user?.id || user?._id;
//   const { on, off } = useSocket(userId, 'owner');

//   useEffect(() => {
//     loadDashboardData();
    
//     // Set up real-time event listeners
//     const handleJobCreated = (data) => {
//       console.log('Real-time: Job created', data);
//       showNotification('New job posted!', 'success');
//       loadDashboardData(); // Reload data
//     };

//     const handleJobUpdated = (data) => {
//       console.log('Real-time: Job updated', data);
//       loadDashboardData(); // Reload data
//     };

//     const handleJobDeleted = (data) => {
//       console.log('Real-time: Job deleted', data);
//       showNotification('Job deleted', 'info');
//       loadDashboardData(); // Reload data
//     };

//     const handleNewApplication = (data) => {
//       console.log('Real-time: New application', data);
//       showNotification(`New application received for ${data.application.job?.title}!`, 'success');
//       loadDashboardData(); // Reload data
//     };

//     const handleApplicationUpdated = (data) => {
//       console.log('Real-time: Application updated', data);
//       loadDashboardData(); // Reload data
//     };

//     // Register event listeners
//     on('job:created', handleJobCreated);
//     on('job:updated', handleJobUpdated);
//     on('job:deleted', handleJobDeleted);
//     on('application:new', handleNewApplication);
//     on('application:updated', handleApplicationUpdated);

//     // Clean up event listeners on unmount
//     return () => {
//       off('job:created', handleJobCreated);
//       off('job:updated', handleJobUpdated);
//       off('job:deleted', handleJobDeleted);
//       off('application:new', handleNewApplication);
//       off('application:updated', handleApplicationUpdated);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const showNotification = (message, type = 'info') => {
//     setNotification({ message, type });
//     setTimeout(() => setNotification(null), 5000);
//   };

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       setConnectionError(null);

//       // Load jobs and applications in parallel
//       const [jobs, applications] = await Promise.all([
//         api.get('/api/jobs/owner/my-jobs', { auth: true }),
//         api.get('/api/applications/owner/all', { auth: true }).catch(() => [])
//       ]);

//       if (jobs && Array.isArray(jobs)) {
//         const activeJobs = jobs.filter(job => job.status === 'active');

//         // Use actual applications count from database (more accurate)
//         const totalApplications = applications?.length || 0;

//         // Update stats
//         setStats([
//           { label: 'Active Jobs', value: activeJobs.length.toString(), icon: IoBriefcaseOutline, color: '#4F46E5' },
//           { label: 'Applications', value: totalApplications.toString(), icon: IoPeopleOutline, color: '#10B981' },
//         ]);

//         // Transform jobs for display
//         const transformedJobs = activeJobs.slice(0, 6).map(job => ({
//           id: job._id,
//           title: job.title,
//           category: job.category,
//           location: job.location,
//           applicants: applications?.filter(app => app.job?._id === job._id).length || 0,
//           status: job.status,
//           posted: job.createdAt ? getTimeAgo(new Date(job.createdAt)) : 'Recently',
//           salary: job.salary,
//         }));

//         setRecentJobs(transformedJobs);
//       }
//     } catch (error) {
//       console.error('Error loading dashboard:', error);
//       setConnectionError(error?.message || 'Failed to load dashboard');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getTimeAgo = (date) => {
//     const now = new Date();
//     const diff = now - date;
//     const minutes = Math.floor(diff / 60000);
//     const hours = Math.floor(minutes / 60);
//     const days = Math.floor(hours / 24);
    
//     if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
//     if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
//     if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
//     return 'Just now';
//   };

//   return (
//     <div className="dashboard">
//       {/* Real-time Notification Toast */}
//       {notification && (
//         <div 
//           style={{
//             position: 'fixed',
//             top: '20px',
//             right: '20px',
//             background: notification.type === 'success' ? '#10B981' : notification.type === 'error' ? '#EF4444' : '#3B82F6',
//             color: 'white',
//             padding: '16px 24px',
//             borderRadius: '12px',
//             boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
//             zIndex: 9999,
//             animation: 'slideInRight 0.3s ease-out',
//             fontWeight: 500
//           }}
//         >
//           {notification.message}
//         </div>
//       )}
      
//       <div className="dashboard-header">
//         <h1>Dashboard</h1>
//         <p>Welcome back! Here's what's happening with your jobs.</p>
//       </div>

//       {connectionError && (
//         <div
//           style={{
//             background: '#FEF2F2',
//             border: '1px solid #FECACA',
//             color: '#B91C1C',
//             padding: '12px 16px',
//             borderRadius: '8px',
//             marginBottom: '16px',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'space-between',
//             flexWrap: 'wrap',
//             gap: '8px'
//           }}
//         >
//           <span>{connectionError}</span>
//           <button
//             type="button"
//             onClick={() => loadDashboardData()}
//             style={{
//               background: '#B91C1C',
//               color: 'white',
//               border: 'none',
//               padding: '8px 16px',
//               borderRadius: '6px',
//               cursor: 'pointer',
//               fontWeight: 600
//             }}
//           >
//             Retry
//           </button>
//         </div>
//       )}

//       {/* Stats Grid - Matching Mobile App */}
//       <div className="stats-grid">
//         {stats.map((stat, index) => {
//           const IconComponent = stat.icon;
//           return (
//             <div key={index} className="stat-card">
//               <div className="stat-icon" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
//                 <IconComponent />
//               </div>
//               <div className="stat-content">
//                 <div className="stat-label">{stat.label}</div>
//                 <div className="stat-value">{stat.value}</div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Recent Jobs - From Backend */}
//       <div className="card">
//         <div className="card-header">
//           <h2>Your Posted Jobs</h2>
//           <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>
//             Jobs posted here appear in the mobile app for workers
//           </p>
//         </div>
//         {loading ? (
//           <div style={{ textAlign: 'center', padding: '40px' }}>
//             <p>Loading jobs...</p>
//           </div>
//         ) : recentJobs.length === 0 ? (
//           <div style={{ textAlign: 'center', padding: '40px' }}>
//             <p>No jobs posted yet. Create your first job!</p>
//           </div>
//         ) : (
//           <div className="table-container">
//             <table className="data-table">
//               <thead>
//                 <tr>
//                   <th>Job Title</th>
//                   <th>Location</th>
//                   <th>Salary</th>
//                   <th>Applicants</th>
//                   <th>Status</th>
//                   <th>Posted</th>
//                   <th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {recentJobs.map((job) => (
//                 <tr key={job.id}>
//                   <td className="job-title-cell">
//                     <div className="job-title-main">{job.title}</div>
//                     <div className="job-category">{job.category}</div>
//                   </td>
//                   <td>{job.location}</td>
//                   <td className="salary-cell">{job.salary}</td>
//                   <td>{job.applicants}</td>
//                   <td>
//                     <span className={`status-badge ${job.status.toLowerCase()}`}>
//                       {job.status}
//                     </span>
//                   </td>
//                   <td>{job.posted}</td>
//                   <td>
//                     <button className="btn-link">View</button>
//                   </td>
//                 </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoBriefcaseOutline, IoPeopleOutline } from 'react-icons/io5';
import './Dashboard.scss';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import Table from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: 'Active Jobs', value: '0', icon: IoBriefcaseOutline, color: '#4F46E5' },
    { label: 'Applications', value: '0', icon: IoPeopleOutline, color: '#10B981' },
  ]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userId = user?.id || user?._id;
  const { on, off } = useSocket(userId, 'owner');

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setConnectionError(null);

      const [jobs, applications] = await Promise.all([
        api.get('/api/jobs/owner/my-jobs', { auth: true }),
        api.get('/api/applications/owner/all', { auth: true }).catch(() => [])
      ]);

      if (jobs && Array.isArray(jobs)) {
        const activeJobs = jobs.filter(job => job.status === 'active');
        const totalApplications = applications?.length || 0;

        setStats([
          { label: 'Active Jobs', value: activeJobs.length.toString(), icon: IoBriefcaseOutline, color: '#4F46E5' },
          { label: 'Applications', value: totalApplications.toString(), icon: IoPeopleOutline, color: '#10B981' },
        ]);

        const transformedJobs = activeJobs.slice(0, 5).map(job => ({
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
      setConnectionError(error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleJobCreated = () => {
      showNotification('New job posted!', 'success');
      loadDashboardData();
    };

    const handleJobDeleted = () => {
      showNotification('Job deleted', 'info');
      loadDashboardData();
    };

    const handleNewApplication = (data) => {
      showNotification(`New application received for ${data.application.job?.title}!`, 'success');
      loadDashboardData();
    };

    on('job:created', handleJobCreated);
    on('job:deleted', handleJobDeleted);
    on('application:new', handleNewApplication);

    return () => {
      off('job:created', handleJobCreated);
      off('job:deleted', handleJobDeleted);
      off('application:new', handleNewApplication);
    };
  }, [loadDashboardData, showNotification, on, off]);

  const tableHeaders = ['Job Title', 'Location', 'Salary', 'Applicants', 'Status', 'Actions'];

  return (
    <div className="dashboard-page page-container">
      {notification && (
        <div className="toast-container">
          <Toast 
            message={notification.message} 
            type={notification.type} 
            onClose={() => setNotification(null)} 
          />
        </div>
      )}

      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Manage your workers and jobs.</p>
        </div>
      </div>

      {connectionError && (
        <div className="card error-state" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: '#EF4444', color: '#EF4444' }}>
          <p>{connectionError}</p>
          <Button variant="outline" onClick={loadDashboardData} style={{ marginTop: '1rem' }}>Retry</Button>
        </div>
      )}

      <div className="stats-grid">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="card stat-card" style={{ marginBottom: 0 }}>
              <div className="stat-icon-wrapper" style={{ backgroundColor: stat.color + '15', color: stat.color }}>
                <IconComponent size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">{stat.label}</span>
                <h2 className="stat-value">{stat.value}</h2>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card dashboard-table-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Internal Postings</h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Your 5 most recent active jobs</p>
          </div>
          <Button variant="outline" className="btn-small" onClick={() => navigate('/jobs')}>View All</Button>
        </div>

        {loading ? (
          <Loader message="Loading your dashboard..." />
        ) : recentJobs.length === 0 ? (
          <div className="empty-state">
            <p>No active jobs found. Start by posting one!</p>
            <Button variant="primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/jobs/create')}>Post a Job</Button>
          </div>
        ) : (
          <Table 
            headers={tableHeaders} 
            data={recentJobs} 
            renderRow={(job) => (
              <tr key={job.id}>
                <td className="job-title-cell">
                  <div className="title">{job.title}</div>
                  <div className="category">{job.category}</div>
                </td>
                <td>{job.location}</td>
                <td className="salary-cell">{job.salary}</td>
                <td>{job.applicants}</td>
                <td>
                  <span className={`badge badge-${job.status === 'active' ? 'success' : 'warning'}`}>
                    {job.status}
                  </span>
                </td>
                <td>
                  <Button variant="outline" className="btn-small" onClick={() => navigate(`/applications?jobId=${job.id}`)}>
                    Details
                  </Button>
                </td>
              </tr>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

