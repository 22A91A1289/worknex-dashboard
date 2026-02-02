import React, { useState, useEffect } from 'react';
import { IoCallOutline, IoPersonOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoStarOutline } from 'react-icons/io5';
import './Applications.css';
import { api } from '../services/api';
import RatingModal from '../components/RatingModal';

const Applications = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedApplicationForRating, setSelectedApplicationForRating] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('\n========================================');
      console.log('🌐 WEB DASHBOARD: Loading applications and jobs...');
      console.log('⏰ Timestamp:', new Date().toISOString());
      console.log('🔑 Auth Token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
      console.log('👤 Current User:', JSON.parse(localStorage.getItem('authUser') || '{}'));
      console.log('========================================\n');
      
      // Load applications and jobs in parallel
      const [applicationsData, jobsData] = await Promise.all([
        api.get('/api/applications/owner/all', { auth: true }),
        api.get('/api/jobs/owner/my-jobs', { auth: true })
      ]);

      console.log('\n📥 RAW Data Received:');
      console.log('Applications:', JSON.stringify(applicationsData, null, 2));
      console.log('Jobs:', JSON.stringify(jobsData, null, 2));
      console.log('📊 Applications count:', applicationsData?.length || 0);
      console.log('📊 Jobs count:', jobsData?.length || 0);

      // Transform applications data
      if (applicationsData && Array.isArray(applicationsData)) {
        console.log('✅ Applications is array, transforming...');
        const transformedApps = applicationsData.map(app => {
          console.log('🔄 Transforming application:', {
            id: app._id,
            applicant: app.applicant,
            job: app.job,
            status: app.status,
            videoUrl: app.applicant?.videoUrl,
            videoUploaded: app.applicant?.videoUploaded
          });
          // Combine skills, workCategories, and workTypes into one skills array
          const allSkills = [
            ...(app.applicant?.skills || []),
            ...(app.applicant?.workCategories || []),
            ...(app.applicant?.workTypes || [])
          ];
          // Remove duplicates
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
        console.log('✅ Transformed applications:', transformedApps);
        setApplications(transformedApps);
      } else {
        console.warn('⚠️ Applications data is not an array:', applicationsData);
        setApplications([]);
      }

      // Transform jobs data
      if (jobsData && Array.isArray(jobsData)) {
        console.log('✅ Jobs is array, transforming...');
        const transformedJobs = jobsData.map(job => ({
          id: job._id,
          title: job.title
        }));
        console.log('✅ Transformed jobs:', transformedJobs);
        setJobs(transformedJobs);
      } else {
        console.warn('⚠️ Jobs data is not an array:', jobsData);
        setJobs([]);
      }
    } catch (error) {
      console.error('\n========================================');
      console.error('❌ ERROR loading data:');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      console.error('========================================\n');
      alert(`Failed to load applications: ${error.message}\n\nCheck console for details.`);
    } finally {
      setLoading(false);
      console.log('✅ Loading complete\n');
    }
  };

  const filteredApplications = selectedJob 
    ? applications.filter(app => app.jobId === selectedJob)
    : applications;

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      console.log(`🔄 Updating application ${applicationId} to status: ${newStatus}`);
      
      // Update status in backend
      await api.patch(`/api/applications/${applicationId}`, {
        status: newStatus.toLowerCase()
      }, { auth: true });

      console.log(`✅ Application ${applicationId} updated successfully`);

      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      alert(`Application ${newStatus === 'accepted' ? 'accepted' : 'rejected'} successfully!`);
    } catch (error) {
      console.error('❌ Error updating application status:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to update application status: ${error.message}`);
    }
  };

  const handleCall = (phone) => {
    window.open(`tel:${phone}`);
  };

  if (loading) {
    return (
      <div className="applications-page">
        <div className="page-header">
          <div>
            <h1>Applications</h1>
            <p>Loading applications...</p>
          </div>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-page">
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          <p>Review and select workers for your jobs ({applications.length} total)</p>
        </div>
        <select 
          className="filter-select"
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
          <div key={app.id} className="application-card">
            <div className="application-header">
              <div className="applicant-info">
                <div className="applicant-avatar">
                  {app.worker.charAt(0)}
                </div>
                <div className="applicant-details">
                  <h3 className="applicant-name">{app.worker}</h3>
                  <div className="applicant-meta">
                    <span className="rating">
                      ⭐ {app.rating}
                    </span>
                    <span className="experience">• {app.experience}</span>
                  </div>
                  <div className="applicant-location">{app.location}</div>
                  {app.phone && app.phone !== 'N/A' && (
                    <div className="applicant-phone">
                      📞 <a href={`tel:${app.phone}`} className="phone-link">{app.phone}</a>
                    </div>
                  )}
                </div>
              </div>
              <span className={`status-badge ${app.status.toLowerCase()}`}>
                {app.status}
              </span>
            </div>

            <div className="application-job">
              <strong>Job:</strong> {app.job}
            </div>

            <div className="application-skills">
              <strong>Skills:</strong>
              <div className="skills-list">
                {app.skills && app.skills.length > 0 ? (
                  app.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))
                ) : (
                  <span className="no-skills">No skills specified</span>
                )}
              </div>
            </div>

            {/* KYC Verification Badge */}
            <div className={`kyc-badge-section ${app.videoUploaded ? 'verified' : 'not-verified'}`}>
              {app.videoUploaded ? (
                <>
                  <div className="kyc-icon verified">✓</div>
                  <div className="kyc-content">
                    <strong>KYC Verified</strong>
                    <p>Applicant has uploaded video introduction</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="kyc-icon not-verified">✗</div>
                  <div className="kyc-content">
                    <strong>KYC Not Verified</strong>
                    <p>No video introduction uploaded</p>
                  </div>
                </>
              )}
            </div>

            <div className="application-footer">
              <div className="application-actions">
                <button 
                  className="btn-icon" 
                  onClick={() => handleCall(app.phone)}
                  title="Call"
                >
                  <IoCallOutline />
                </button>
                <button 
                  className="btn-icon"
                  title="View Profile"
                >
                  <IoPersonOutline />
                </button>
              </div>
              
              {app.status.toLowerCase() === 'pending' && (
                <div className="status-actions">
                  <button
                    className="btn-status accept"
                    onClick={() => handleStatusChange(app.id, 'accepted')}
                  >
                    <IoCheckmarkCircleOutline />
                    Accept
                  </button>
                  <button
                    className="btn-status reject"
                    onClick={() => handleStatusChange(app.id, 'rejected')}
                  >
                    <IoCloseCircleOutline />
                    Reject
                  </button>
                </div>
              )}
              
              {(app.status.toLowerCase() === 'accepted' || app.status.toLowerCase() === 'completed') && (
                <div className="rating-action">
                  <button
                    className="btn-rate"
                    onClick={() => {
                      setSelectedApplicationForRating(app);
                      setRatingModalOpen(true);
                    }}
                  >
                    <IoStarOutline />
                    Rate Worker
                  </button>
                </div>
              )}
            </div>

            <div className="application-date">
              Applied on {new Date(app.applied).toLocaleDateString('en-IN', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredApplications.length === 0 && !loading && (
        <div className="empty-state">
          <h3>No Applications Yet</h3>
          <p>When workers apply to your jobs, they will appear here</p>
        </div>
      )}
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={(success) => {
          setRatingModalOpen(false);
          setSelectedApplicationForRating(null);
          if (success) {
            // Optionally reload applications to update rating status
            loadData();
          }
        }}
        application={selectedApplicationForRating}
      />
    </div>
  );
};

export default Applications;
