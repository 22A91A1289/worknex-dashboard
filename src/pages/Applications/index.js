import React, { useState, useEffect } from 'react';
import { IoCallOutline, IoPersonOutline, IoStarOutline } from 'react-icons/io5';
import './Applications.scss';
import { api } from '../../services/api';
import RatingModal from '../../components/RatingModal';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';

const Applications = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedApplicationForRating, setSelectedApplicationForRating] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [applicationsData, jobsData] = await Promise.all([
        api.get('/api/applications/owner/all', { auth: true }),
        api.get('/api/jobs/owner/my-jobs', { auth: true })
      ]);

      if (applicationsData && Array.isArray(applicationsData)) {
        const transformedApps = applicationsData.map(app => {
          const allSkills = [
            ...(app.applicant?.skills || []),
            ...(app.applicant?.workCategories || []),
            ...(app.applicant?.workTypes || [])
          ];
          const uniqueSkills = [...new Set(allSkills)].filter(Boolean);
          
          return {
            id: app._id,
            worker: app.applicant?.name || 'Unknown Worker',
            job: app.job?.title || 'Unknown Job',
            jobId: app.job?._id || app.jobId,
            phone: app.applicant?.phone || 'N/A',
            experience: app.applicant?.experience || app.applicant?.experienceLevel || 'Not specified',
            rating: app.applicant?.rating || 0,
            location: app.applicant?.location || 'Not specified',
            status: app.status || 'pending',
            applied: app.appliedAt || app.createdAt,
            skills: uniqueSkills,
            applicantId: app.applicant?._id,
            videoUrl: app.applicant?.videoUrl || null,
            videoUploaded: app.applicant?.videoUploaded || false
          };
        });
        setApplications(transformedApps);
      } else {
        setApplications([]);
      }

      if (jobsData && Array.isArray(jobsData)) {
        const transformedJobs = jobsData.map(job => ({
          id: job._id,
          title: job.title
        }));
        setJobs(transformedJobs);
      } else {
        setJobs([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({ message: `Failed to load applications: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = selectedJob 
    ? applications.filter(app => app.jobId === selectedJob)
    : applications;

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await api.patch(`/api/applications/${applicationId}`, {
        status: newStatus.toLowerCase()
      }, { auth: true });

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      setNotification({ message: `Application ${newStatus === 'accepted' ? 'accepted' : 'rejected'} successfully!`, type: 'success' });
    } catch (error) {
      console.error('Error updating status:', error);
      setNotification({ message: `Failed to update: ${error.message}`, type: 'error' });
    }
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
  };

  if (loading) {
    return (
      <div className="applications-page page-container">
        <div className="loading-state">
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page page-container">
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
          <h1 className="page-title">Applications</h1>
          <p className="page-subtitle">Review and select workers for your jobs.</p>
        </div>
        <select 
          className="input-field filter-select"
          value={selectedJob || ''}
          onChange={(e) => setSelectedJob(e.target.value || null)}
        >
          <option value="">All Jobs</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>

      <div className="applications-grid">
        {filteredApplications.map((app) => (
          <div key={app.id} className="card application-card">
            <div className="application-header">
              <div className="applicant-profile">
                <div className="avatar">
                  {app.worker.charAt(0)}
                </div>
                <div className="applicant-info">
                  <h3 className="applicant-name">{app.worker}</h3>
                  <div className="applicant-meta">
                    <span className="rating-star">⭐ {app.rating}</span> • {app.experience}
                  </div>
                </div>
              </div>
              <span className={`badge badge-${app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'error' : 'warning'}`}>
                {app.status}
              </span>
            </div>

            <div className="job-info">
              <strong className="label">Job:</strong> <span className="value">{app.job}</span>
            </div>

            <div className="skills-section">
              <div className="skills-list">
                {app.skills.slice(0, 3).map((skill, index) => (
                  <span key={index} className="badge badge-info skill-badge">{skill}</span>
                ))}
                {app.skills.length > 3 && <span className="more-skills">+{app.skills.length - 3} more</span>}
              </div>
            </div>

            <div className={`kyc-status ${app.videoUploaded ? 'verified' : 'pending'}`}>
              <div className="dot"></div>
              <div className="kyc-info">
                <strong className="kyc-title">{app.videoUploaded ? 'KYC Verified' : 'KYC Pending'}</strong>
                <span className="kyc-subtitle">{app.videoUploaded ? 'Video intro available' : 'No video uploaded'}</span>
              </div>
            </div>

            <div className="application-footer">
              <div className="footer-actions">
                <Button variant="outline" className="btn-icon" onClick={() => handleCall(app.phone)} title="Call">
                  <IoCallOutline size={18} />
                </Button>
                <Button variant="outline" className="btn-icon" title="View Profile">
                  <IoPersonOutline size={18} />
                </Button>
              </div>
              
              <div className="status-actions">
                {app.status.toLowerCase() === 'pending' && (
                  <>
                    <Button variant="secondary" className="btn-small" onClick={() => handleStatusChange(app.id, 'rejected')}>
                      Reject
                    </Button>
                    <Button variant="primary" className="btn-small" onClick={() => handleStatusChange(app.id, 'accepted')}>
                      Accept
                    </Button>
                  </>
                )}
                {(app.status.toLowerCase() === 'accepted' || app.status.toLowerCase() === 'completed') && (
                  <Button variant="outline" className="btn-small" onClick={() => { setSelectedApplicationForRating(app); setRatingModalOpen(true); }}>
                    <IoStarOutline size={14} /> Rate
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && !loading && (
        <div className="card empty-state">
          <h3>No Applications Found</h3>
          <p>When workers apply, they will appear here.</p>
        </div>
      )}
      
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={(success) => {
          setRatingModalOpen(false);
          setSelectedApplicationForRating(null);
          if (success) loadData();
        }}
        application={selectedApplicationForRating}
      />
    </div>
  );
};

export default Applications;

