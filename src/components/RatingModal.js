import React, { useState } from 'react';
import { IoStar, IoStarOutline, IoClose } from 'react-icons/io5';
import './RatingModal.css';
import { api } from '../services/api';

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
      
      // Handle both transformed and original application structure
      const ratedUserId = application.applicantId || application.applicant?._id;
      const applicationId = application.id || application._id;
      const jobId = application.jobId || application.job?._id;
      
      console.log('⭐ Submitting rating:', {
        ratedUserId,
        rating,
        review,
        applicationId
      });

      if (!ratedUserId) {
        throw new Error('Worker ID not found in application data');
      }

      if (!applicationId) {
        throw new Error('Application ID not found');
      }

      const response = await api.post('/api/ratings', {
        ratedUserId,
        rating,
        review: review.trim(),
        applicationId,
        jobId
      }, { auth: true });

      console.log('✅ Rating submitted:', response);

      alert('Thank you for your feedback!');
      
      // Reset and close
      setRating(0);
      setReview('');
      onClose(true); // Pass true to indicate success

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
      default: return 'Click to rate';
    }
  };

  // Handle both transformed and original application structure
  const workerName = application.worker || application.applicant?.name || 'this worker';
  const jobTitle = application.job || application.job?.title;

  return (
    <div className="rating-modal-overlay" onClick={onClose}>
      <div className="rating-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="rating-modal-close" onClick={onClose}>
          <IoClose size={24} />
        </button>

        <div className="rating-modal-header">
          <div className="rating-modal-icon">
            <IoStar size={40} color="#FFD700" />
          </div>
          <h2>Rate Worker</h2>
          <p>How was your experience with {workerName}?</p>
          {jobTitle && (
            <p className="rating-modal-job">Job: {jobTitle}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star Rating */}
          <div className="rating-stars-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="rating-star-button"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                {star <= (hoveredRating || rating) ? (
                  <IoStar size={48} color="#FFD700" />
                ) : (
                  <IoStarOutline size={48} color="#D1D5DB" />
                )}
              </button>
            ))}
          </div>

          {/* Rating Text */}
          <div className={`rating-text ${(hoveredRating || rating) > 0 ? 'active' : ''}`}>
            {getRatingText()}
          </div>

          {/* Review Input */}
          <div className="rating-review-section">
            <label htmlFor="review">Write a review (optional)</label>
            <textarea
              id="review"
              placeholder="Share your experience..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <div className="rating-char-count">
              {review.length}/500 characters
            </div>
          </div>

          {/* Buttons */}
          <div className="rating-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={rating === 0 || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
