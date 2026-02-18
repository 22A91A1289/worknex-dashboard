import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoArrowBackOutline } from 'react-icons/io5';
import './Jobs.scss';
import { api } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Toast from '../../components/ui/Toast';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.salary) {
      setNotification({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    try {
      setLoading(true);
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
      setNotification({ message: 'Job posted successfully!', type: 'success' });
      setTimeout(() => navigate('/jobs'), 1500);
    } catch (error) {
      console.error('Error creating job:', error);
      setNotification({ message: 'Failed to create job: ' + (error?.message || 'Please try again'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-job-page page-container">
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
          <div className="back-link" onClick={() => navigate('/jobs')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', cursor: 'pointer', marginBottom: '8px' }}>
            <IoArrowBackOutline /> Back to Jobs
          </div>
          <h1 className="page-title">Create New Job</h1>
          <p className="page-subtitle">Post a new job opportunity for workers.</p>
        </div>
      </div>

      <div className="card form-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <form onSubmit={handleCreateJob} className="job-form">
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <Input
              label="Job Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Electrician Helper Needed"
            />
            
            <div className="form-group">
              <label className="form-label">Job Category *</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
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
              <label className="form-label">Experience Level</label>
              <select
                className="input-field"
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
                <option value="any">Any</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Job Type</label>
              <select
                className="input-field"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none' }}
              >
                <option value="Daily Work">Daily Work</option>
                <option value="Contract">Contract</option>
                <option value="Full-time">Full-time</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '24px' }}>
            <label className="form-label">Job Description</label>
            <textarea
              className="input-field"
              rows="4"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the job, requirements, and expectations..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', resize: 'vertical' }}
            />
          </div>

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '32px' }}>
            <Button variant="secondary" type="button" onClick={() => navigate('/jobs')}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post Job'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
