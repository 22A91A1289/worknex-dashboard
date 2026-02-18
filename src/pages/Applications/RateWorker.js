import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  IoArrowBackOutline, 
  IoStar, 
  IoStarOutline 
} from 'react-icons/io5';
import '../Applications/Applications.scss';
import { api } from '../../../services/api';
import Button from '../../../components/ui/Button';
import Toast from '../../../components/ui/Toast';
import Loader from '../../../components/ui/Loader';

const RateWorker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const applications = await api.get('/api/applications/owner/all', { auth: true });
        if (applications && Array.isArray(applications)) {
          const found = applications.find(app => app._id === id);
          if (found) {
            setApplication(found);
          } else {
            showNotification('Application not found', 'error');
            setTimeout(() => navigate('/applications'), 2000);
          }
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        showNotification('Failed to load application details', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [id, navigate, showNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      showNotification('Please select a rating', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const ratedUserId = application.applicant?._id;
      const applicationId = application._id;
      const jobId = application.job?._id;

      await api.post('/api/ratings', {
        ratedUserId,
        rating,
        review: review.trim(),
        applicationId,
        jobId
      }, { auth: true });

      showNotification('Rating submitted successfully!', 'success');
      setTimeout(() => navigate('/applications'), 1500);
    } catch (error) {
      console.error('Rating submission error:', error);
      showNotification(error.message || 'Failed to submit rating', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = () => {
    const currentRating = hoveredRating || rating;
    switch (currentRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate your experience';
    }
  };

  if (loading) {
    return (
      <div className="rate-worker-page page-container">
        <Loader message="Loading application details..." />
      </div>
    );
  }

  if (!application) return null;

  return (
    <div className="rate-worker-page page-container">
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
          <div className="back-link" onClick={() => navigate('/applications')} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', cursor: 'pointer', marginBottom: '8px' }}>
            <IoArrowBackOutline /> Back to Applications
          </div>
          <h1 className="page-title">Rate Worker</h1>
          <p className="page-subtitle">Leave a review for {application.applicant?.name}.</p>
        </div>
      </div>

      <div className="card rating-form-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="worker-summary" style={{ marginBottom: '32px' }}>
          <div className="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#4F46E5', margin: '0 auto 16px' }}>
            {application.applicant?.name?.charAt(0)}
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{application.applicant?.name}</h2>
          <p style={{ color: '#6B7280' }}>Job: {application.job?.title}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="stars-wrapper" style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-btn"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', padding: '4px' }}
              >
                {star <= (hoveredRating || rating) ? (
                  <IoStar size={48} color="#F59E0B" />
                ) : (
                  <IoStarOutline size={48} color="#D1D5DB" />
                )}
              </button>
            ))}
          </div>

          <div className="rating-text" style={{ fontSize: '1.25rem', fontWeight: '600', color: (hoveredRating || rating) > 0 ? '#111827' : '#9CA3AF', marginBottom: '32px' }}>
            {getRatingText()}
          </div>

          <div className="form-group" style={{ textAlign: 'left', marginBottom: '32px' }}>
            <label className="form-label" style={{ fontWeight: '600', display: 'block', marginBottom: '8px' }}>Your Review (Optional)</label>
            <textarea
              className="input-field"
              placeholder="Tell us about the worker's performance..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              rows={4}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', resize: 'vertical' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#9CA3AF', marginTop: '4px' }}>
              {review.length}/500
            </div>
          </div>

          <div className="form-actions" style={{ display: 'flex', gap: '16px' }}>
            <Button variant="secondary" style={{ flex: 1 }} type="button" onClick={() => navigate('/applications')}>Cancel</Button>
            <Button 
              variant="primary" 
              style={{ flex: 1 }} 
              type="submit" 
              disabled={rating === 0 || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RateWorker;
