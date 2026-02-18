import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddOutline } from 'react-icons/io5';
import './Jobs.scss';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Toast from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Loader from '../../components/ui/Loader';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [notification, setNotification] = useState(null);

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userId = user?.id || user?._id;
  const { on, off } = useSocket(userId, 'owner');

  useEffect(() => {
    loadJobs();
    
    const handleJobCreated = () => {
      showNotification('New job posted successfully!', 'success');
      loadJobs();
    };

    on('job:created', handleJobCreated);
    on('job:updated', loadJobs);
    on('job:deleted', () => {
      showNotification('Job deleted successfully!', 'info');
      loadJobs();
    });
    on('application:new', (data) => {
      showNotification(`New application received for ${data.application.job?.title}!`, 'success');
      loadJobs();
    });

    return () => {
      off('job:created', handleJobCreated);
      off('job:updated', loadJobs);
      off('job:deleted');
      off('application:new');
    };
  }, [on, off]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      const backendJobs = await api.get('/api/jobs/owner/my-jobs', { auth: true });
      
      if (backendJobs && Array.isArray(backendJobs)) {
        const transformedJobs = backendJobs.map(job => ({
          id: job._id,
          title: job.title,
          category: job.category,
          type: job.type,
          location: job.location,
          salary: job.salary,
          applicants: job.applicants?.length || 0,
          status: job.status || 'active',
          posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently',
        }));
        setJobs(transformedJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (jobId) => {
    setJobToDelete(jobId);
    setShowDeleteModal(true);
  };

  const handleDeleteJob = async () => {
    try {
      await api.del(`/api/jobs/${jobToDelete}`, { auth: true });
      await loadJobs();
      showNotification('Job deleted successfully', 'success');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting job:', error);
      showNotification('Failed to delete job', 'error');
    }
  };

  const jobTableHeaders = ['Job Title', 'Category', 'Location', 'Salary', 'Applicants', 'Status', 'Actions'];

  return (
    <div className="jobs-page page-container">
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
          <h1 className="page-title">Job Management</h1>
          <p className="page-subtitle">Create and manage your job postings easily.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/jobs/create')}>
          <IoAddOutline size={20} />
          Create New Job
        </Button>
      </div>

      {loading ? (
        <Loader message="Loading jobs..." />
      ) : jobs.length === 0 ? (
        <div className="card empty-state">
          <p>No jobs posted yet. Create your first job to get started!</p>
        </div>
      ) : (
        <Table 
          headers={jobTableHeaders} 
          data={jobs} 
          renderRow={(job) => (
            <tr key={job.id}>
              <td className="job-title-cell">{job.title}</td>
              <td>
                <span className="badge badge-info">{job.category}</span>
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
                <div className="action-buttons">
                  <Button 
                    variant="outline" 
                    className="btn-small"
                    onClick={() => navigate(`/applications?jobId=${job.id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    className="btn-small btn-danger"
                    onClick={() => confirmDelete(job.id)}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          )}
        />
      )}

      <ConfirmationModal 
        isOpen={showDeleteModal}
        title="Delete Job"
        message="Are you sure you want to delete this job posting? This action cannot be undone."
        onConfirm={handleDeleteJob}
        onCancel={() => setShowDeleteModal(false)}
        confirmText="Delete"
      />
    </div>
  );
};

export default Jobs;

