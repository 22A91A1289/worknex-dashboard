import React, { useState, useEffect } from 'react';
import { IoAddOutline, IoCloseOutline } from 'react-icons/io5';
import './Jobs.css';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('authUser') || '{}');
  
  // Connect to socket for real-time updates
  const { on, off } = useSocket(user._id, 'owner');

  useEffect(() => {
    loadJobs();
    
    // Set up real-time event listeners
    const handleJobCreated = (data) => {
      console.log('Real-time: Job created', data);
      showNotification('New job posted successfully!', 'success');
      loadJobs(); // Reload jobs list
    };

    const handleJobUpdated = (data) => {
      console.log('Real-time: Job updated', data);
      loadJobs(); // Reload jobs list
    };

    const handleJobDeleted = (data) => {
      console.log('Real-time: Job deleted', data);
      showNotification('Job deleted successfully!', 'info');
      loadJobs(); // Reload jobs list
    };

    const handleNewApplication = (data) => {
      console.log('Real-time: New application', data);
      showNotification(`New application received for ${data.application.job?.title}!`, 'success');
      loadJobs(); // Reload to update applicant counts
    };

    // Register event listeners
    on('job:created', handleJobCreated);
    on('job:updated', handleJobUpdated);
    on('job:deleted', handleJobDeleted);
    on('application:new', handleNewApplication);

    // Clean up event listeners on unmount
    return () => {
      off('job:created', handleJobCreated);
      off('job:updated', handleJobUpdated);
      off('job:deleted', handleJobDeleted);
      off('application:new', handleNewApplication);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
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
      // Keep empty array on error
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
      alert('Please fill all required fields');
      return;
    }

    try {
      // Create job via backend API
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
      
      // Reload jobs to show the new one
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
      alert('Job posted successfully! It will now appear in the mobile app for workers.');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Failed to create job: ' + (error?.message || 'Please try again'));
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) {
      return;
    }

    try {
      await api.del(`/api/jobs/${jobId}`, { auth: true });
      await loadJobs();
      alert('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job: ' + (error?.message || 'Please try again'));
    }
  };

  return (
    <div className="jobs-page">
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
      
      <div className="page-header">
        <div>
          <h1>Job Management</h1>
          <p>Create and manage your job postings. Jobs posted here will appear in the mobile app for workers.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <IoAddOutline />
          Create New Job
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No jobs posted yet. Create your first job to get started!</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Salary</th>
                  <th>Applicants</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="job-title">{job.title}</td>
                  <td>
                    <span className={`category-badge ${job.category.toLowerCase().replace(' ', '-')}`}>
                      {job.category}
                    </span>
                  </td>
                  <td>{job.location}</td>
                  <td className="salary-cell">{job.salary}</td>
                  <td>{job.applicants}</td>
                  <td>
                    <span className={`status-badge ${job.status.toLowerCase()}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-link"
                        onClick={() => {
                          // Navigate to applications for this job
                          window.location.href = `/applications?jobId=${job.id}`;
                        }}
                      >
                        View Applications ({job.applicants})
                      </button>
                      <button 
                        className="btn-link"
                        style={{ color: '#EF4444', marginLeft: '8px' }}
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Job</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <IoCloseOutline />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Electrician Helper Needed"
                />
              </div>

              <div className="form-group">
                <label>Job Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
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

              <div className="form-group">
                <label>Job Type *</label>
                <div className="category-selector">
                  <button
                    type="button"
                    className={`category-option ${formData.type === 'Daily Work' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'Daily Work')}
                  >
                    Daily Work
                  </button>
                  <button
                    type="button"
                    className={`category-option ${formData.type === 'Technical Work' ? 'active' : ''}`}
                    onClick={() => handleInputChange('type', 'Technical Work')}
                  >
                    Technical Work
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Srikakulam, Andhra Pradesh"
                />
              </div>

              <div className="form-group">
                <label>Salary per Day *</label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', e.target.value)}
                  placeholder="e.g., ₹500/day"
                />
              </div>

              <div className="form-group">
                <label>Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                  <option value="any">Any</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.trainingProvided}
                    onChange={(e) => handleInputChange('trainingProvided', e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Training Provided
                </label>
              </div>

              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  rows="4"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the job requirements and responsibilities..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateJob}>
                Post Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
