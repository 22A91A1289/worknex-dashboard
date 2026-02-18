import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoCloseOutline } from 'react-icons/io5';
import './Jobs.scss';
import { api } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table from '../../components/ui/Table';
import Toast from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Construction',
    type: 'Daily Work',
    location: '',
    salary: '',
    description: '',
    experienceLevel: 'beginner',
    trainingProvided: false,
  });

  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  const userId = user?.id || user?._id;
  const { on, off } = useSocket(userId, 'owner');

  useEffect(() => {
    loadJobs();
    
    const handleJobCreated = (data) => {
      showNotification('New job posted successfully!', 'success');
      loadJobs();
    };

    const handleJobUpdated = (data) => {
      loadJobs();
    };

    const handleJobDeleted = (data) => {
      showNotification('Job deleted successfully!', 'info');
      loadJobs();
    };

    const handleNewApplication = (data) => {
      showNotification(`New application received for ${data.application.job?.title}!`, 'success');
      loadJobs();
    };

    on('job:created', handleJobCreated);
    on('job:updated', handleJobUpdated);
    on('job:deleted', handleJobDeleted);
    on('application:new', handleNewApplication);

    return () => {
      off('job:created', handleJobCreated);
      off('job:updated', handleJobUpdated);
      off('job:deleted', handleJobDeleted);
      off('application:new', handleNewApplication);
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
          description: job.description,
          experienceLevel: job.experienceLevel,
          trainingProvided: job.trainingProvided,
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

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreateJob = async () => {
    if (!formData.title || !formData.location || !formData.salary) {
      showNotification('Please fill all required fields', 'error');
      return;
    }

    try {
      const jobData = {
        title: formData.title,
        category: formData.category,
        type: formData.type,
        location: formData.location,
        salary: formData.salary,
        description: formData.description || '',
        experienceLevel: formData.experienceLevel,
        trainingProvided: formData.trainingProvided,
      };

      await api.post('/api/jobs', jobData, { auth: true });
      await loadJobs();
      
      setShowCreateModal(false);
      setFormData({
        title: '',
        category: 'Construction',
        type: 'Daily Work',
        location: '',
        salary: '',
        description: '',
        experienceLevel: 'beginner',
        trainingProvided: false,
      });
      showNotification('Job posted successfully!', 'success');
    } catch (error) {
      console.error('Error creating job:', error);
      showNotification('Failed to create job: ' + (error?.message || 'Please try again'), 'error');
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
      showNotification('Failed to delete job: ' + (error?.message || 'Please try again'), 'error');
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
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <IoAddOutline size={20} />
          Create New Job
        </Button>
      </div>

      {loading ? (
        <div className="card loading-state">
          <p>Loading jobs...</p>
        </div>
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
                    onClick={() => { window.location.href = `/applications?jobId=${job.id}`; }}
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

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Job</h2>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                <IoCloseOutline size={24} />
              </button>
            </div>
            <div className="modal-body">
              <Input
                label="Job Title *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="e.g., Electrician Helper Needed"
              />
              <div className="form-group">
                <label>Job Category *</label>
                <select
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="Construction">Construction</option>
                  <option value="Farming">Farming</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Mechanic">Mechanic</option>
                </select>
              </div>
              <Input
                label="Location *"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Srikakulam, Andhra Pradesh"
              />
              <Input
                label="Salary per Day *"
                value={formData.salary}
                onChange={(e) => handleInputChange('salary', e.target.value)}
                placeholder="e.g., ₹500/day"
              />
              <div className="form-group">
                <label>Experience Level</label>
                <select
                  className="input-field"
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                  <option value="any">Any</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateJob}>Post Job</Button>
            </div>
          </div>
        </div>
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

