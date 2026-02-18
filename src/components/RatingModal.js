import React, { useState } from 'react';
import { IoStar, IoStarOutline, IoClose } from 'react-icons/io5';
import './RatingModal.scss';
import { api } from '../services/api';
import Button from './ui/Button';

const RatingModal = ({ isOpen, onClose, application }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !application) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      
      const ratedUserId = application.applicantId || application.applicant?._id;
      const applicationId = application.id || application._id;
      const jobId = application.jobId || application.job?._id;
      
      if (!ratedUserId || !applicationId) {
        throw new Error('Required IDs not found in application data');
      }

      await api.post('/api/ratings', {
        ratedUserId,
        rating,
        review: review.trim(),
        applicationId,
        jobId
      }, { auth: true });

      alert('Thank you for your feedback!');
      setRating(0);
      setReview('');
      onClose(true);

    } catch (error) {
      console.error('❌ Rating submission error:', error);
      alert(error.message || 'Failed to submit rating. Please try again.');
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

  const workerName = application.worker || application.applicant?.name || 'this worker';
  const jobTitle = application.job || application.job?.title;

  return (
    <div className="modal-overlay rating-modal" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <IoClose size={24} />
        </button>

        <div className="modal-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="rating-icon-box">
            <IoStar size={40} />
          </div>
          <h2 className="modal-title">Rate Worker</h2>
          <p className="modal-message">How was your experience with {workerName}?</p>
          {jobTitle && <p className="job-label">Job: {jobTitle}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="stars-wrapper">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="star-btn"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                {star <= (hoveredRating || rating) ? (
                  <IoStar size={44} color="#F59E0B" />
                ) : (
                  <IoStarOutline size={44} color="#D1D5DB" />
                )}
              </button>
            ))}
          </div>

          <div className={`rating-status ${(hoveredRating || rating) > 0 ? 'active' : ''}`}>
            {getRatingText()}
          </div>

          <div className="form-group">
            <label className="form-label">Review (Optional)</label>
            <textarea
              className="input-field"
              placeholder="Tell us about the worker's performance..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              rows={4}
              style={{ minHeight: '100px', resize: 'vertical' }}
            />
            <div className="char-count">{review.length}/500</div>
          </div>

          <div className="modal-actions" style={{ marginTop: '2rem' }}>
            <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button 
              variant="primary" 
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

export default RatingModal;

