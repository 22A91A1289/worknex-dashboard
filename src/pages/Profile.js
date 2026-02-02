import React, { useState, useEffect } from 'react';
import { 
  IoCameraOutline, 
  IoCheckmarkCircle,
  IoBriefcaseOutline,
  IoPeopleOutline,
  IoStarOutline,
  IoTimeOutline,
  IoLocationOutline,
  IoRefreshOutline
} from 'react-icons/io5';
import './Profile.css';
import { api } from '../services/api';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    businessName: '',
    businessType: '',
    bio: '',
    rating: 0,
    reviews: 0,
  });

  const [profileStats, setProfileStats] = useState([
    { icon: IoBriefcaseOutline, label: 'Active Jobs', value: '0', color: '#10B981', description: 'Currently posted' },
    { icon: IoPeopleOutline, label: 'Total Hires', value: '0', color: '#3B82F6', description: 'Workers hired' },
    { icon: IoStarOutline, label: 'Rating', value: '0.0', color: '#F59E0B', description: 'Out of 5.0' },
    { icon: IoTimeOutline, label: 'Applications', value: '0', color: '#8B5CF6', description: 'Total received' },
  ]);

  const [profileImage, setProfileImage] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Fetch profile data from backend
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching employer profile data...');
      console.log('🔑 Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing');

      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('❌ No auth token found');
        alert('⚠️ Please login again. Your session may have expired.');
        window.location.href = '/login';
        return;
      }

      // Fetch user profile
      const userData = await api.get('/api/users/profile', { auth: true });
      console.log('✅ User data:', userData);

      // Fetch jobs for stats
      const jobsData = await api.get('/api/jobs/owner/my-jobs', { auth: true });
      console.log('✅ Jobs data:', jobsData);

      // Fetch applications for stats
      const applicationsData = await api.get('/api/applications/owner/all', { auth: true });
      console.log('✅ Applications data:', applicationsData);

      // Update profile data
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        businessName: userData.businessName || '',
        businessType: userData.businessType || '',
        bio: userData.bio || '',
        rating: userData.rating || 0,
        reviews: userData.reviews || 0,
      });

      setTempProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: userData.location || '',
        businessName: userData.businessName || '',
        businessType: userData.businessType || '',
        bio: userData.bio || '',
        rating: userData.rating || 0,
        reviews: userData.reviews || 0,
      });

      // Calculate stats
      const activeJobs = Array.isArray(jobsData) ? jobsData.filter(job => job.status === 'active').length : 0;
      const totalApplications = Array.isArray(applicationsData) ? applicationsData.length : 0;
      const acceptedApplications = Array.isArray(applicationsData) 
        ? applicationsData.filter(app => app.status === 'accepted' || app.status === 'completed').length 
        : 0;

      // Update stats
      setProfileStats([
        { icon: IoBriefcaseOutline, label: 'Active Jobs', value: activeJobs.toString(), color: '#10B981', description: 'Currently posted' },
        { icon: IoPeopleOutline, label: 'Total Hires', value: acceptedApplications.toString(), color: '#3B82F6', description: 'Workers hired' },
        { icon: IoStarOutline, label: 'Rating', value: userData.rating ? userData.rating.toFixed(1) : '0.0', color: '#F59E0B', description: 'Out of 5.0' },
        { icon: IoTimeOutline, label: 'Applications', value: totalApplications.toString(), color: '#8B5CF6', description: 'Total received' },
      ]);

      console.log('✅ Profile stats calculated:', {
        activeJobs,
        totalApplications,
        acceptedApplications,
        rating: userData.rating
      });

    } catch (error) {
      console.error('❌ Error fetching profile data:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });

      let errorType = 'unknown';
      let errorMessage = 'Failed to load profile data. ';
      
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorType = 'network';
        errorMessage = 'Backend server is not running!';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorType = 'auth';
        errorMessage = 'Session expired. Please login again.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.message.includes('404')) {
        errorType = 'notfound';
        errorMessage = 'Profile not found.';
      } else {
        errorMessage = error.message;
      }

      setLoadError({ type: errorType, message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleInputChange = (field, value) => {
    setTempProfileData({
      ...tempProfileData,
      [field]: value
    });
  };

  const handleSave = async () => {
    try {
      console.log('💾 Starting profile save...');
      
      // Validate required fields
      if (!tempProfileData.name || !tempProfileData.phone || !tempProfileData.location) {
        alert('⚠️ Please fill in all required fields:\n- Name\n- Phone\n- Location');
        return;
      }

      const updatePayload = {
        name: tempProfileData.name,
        phone: tempProfileData.phone,
        location: tempProfileData.location,
        bio: tempProfileData.bio,
        businessName: tempProfileData.businessName,
        businessType: tempProfileData.businessType
      };

      console.log('💾 Saving profile updates:', updatePayload);

      // Check auth
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('⚠️ Session expired. Please login again.');
        window.location.href = '/login';
        return;
      }

      // Update profile on backend
      const updatedUser = await api.put('/api/users/profile', updatePayload, { auth: true });
      console.log('✅ Profile updated on backend:', updatedUser);

      // Update local state
      setProfileData(tempProfileData);
      setIsEditMode(false);
      alert('✅ Success! Your profile has been updated successfully!');

    } catch (error) {
      console.error('❌ Error saving profile:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name
      });

      let errorMessage = '❌ Failed to save profile.\n\n';
      
      if (error.message === 'Failed to fetch') {
        errorMessage += '🚨 Backend server is not running!\n\n';
        errorMessage += 'Please start: cd backend && npm start';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage += '⚠️ Session expired. Please login again.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        errorMessage += error.message;
      }

      alert(errorMessage);
    }
  };

  const handleCancel = () => {
    setTempProfileData(profileData);
    setIsEditMode(false);
  };

  const displayData = isEditMode ? tempProfileData : profileData;

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="spinner" style={{ 
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #4F46E5',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '8px' }}>
            Loading profile...
          </p>
          <p style={{ color: '#9CA3AF', fontSize: '14px' }}>
            This may take a few seconds
          </p>
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: '#FEF3C7', 
            borderRadius: '8px',
            maxWidth: '500px',
            margin: '30px auto'
          }}>
            <p style={{ color: '#92400E', fontSize: '14px', margin: 0 }}>
              <strong>⚠️ If loading takes too long:</strong><br/>
              Backend server might not be running.<br/>
              <code style={{ 
                display: 'block', 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#FFF', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                cd backend && npm start
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="profile-page">
        <div className="error-container" style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '20px'
          }}>
            {loadError.type === 'network' ? '🔌' : loadError.type === 'auth' ? '🔒' : '❌'}
          </div>
          <h2 style={{ 
            color: '#1F2937', 
            fontSize: '24px', 
            marginBottom: '12px',
            fontWeight: '700'
          }}>
            {loadError.type === 'network' ? 'Backend Not Running' : 
             loadError.type === 'auth' ? 'Session Expired' : 
             'Failed to Load Profile'}
          </h2>
          <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: '24px' }}>
            {loadError.message}
          </p>
          
          {loadError.type === 'network' && (
            <div style={{ 
              backgroundColor: '#FEF3C7', 
              padding: '20px', 
              borderRadius: '12px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ color: '#92400E', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>
                To start the backend:
              </p>
              <ol style={{ color: '#92400E', fontSize: '14px', margin: 0, paddingLeft: '20px' }}>
                <li>Open terminal/command prompt</li>
                <li>Navigate to backend folder</li>
                <li>Run: <code style={{ 
                  backgroundColor: '#FFF', 
                  padding: '2px 8px', 
                  borderRadius: '4px' 
                }}>npm start</code></li>
              </ol>
              <code style={{ 
                display: 'block', 
                marginTop: '12px', 
                padding: '12px', 
                backgroundColor: '#FFF', 
                borderRadius: '8px',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}>
                cd "c:\React native\myapp\backend"<br/>
                npm start
              </code>
            </div>
          )}

          <button 
            onClick={() => {
              setLoadError(null);
              setLoading(true);
              fetchProfileData();
            }}
            style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '12px'
            }}
          >
            🔄 Try Again
          </button>

          {loadError.type !== 'auth' && (
            <button 
              onClick={() => window.location.href = '/login'}
              style={{
                backgroundColor: '#F3F4F6',
                color: '#374151',
                padding: '12px 32px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p>Manage your employer profile and settings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isEditMode && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setLoadError(null);
                fetchProfileData();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh data from backend"
            >
              <IoRefreshOutline /> Refresh
            </button>
          )}
          {!isEditMode ? (
            <button className="btn btn-primary" onClick={() => setIsEditMode(true)}>
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Header with Photo */}
      <div className="card profile-header-card">
        <div className="profile-header-content">
          <div className="avatar-container">
            <div className="avatar">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="avatar-image" />
              ) : (
                <span className="avatar-text">{getInitials(displayData.name)}</span>
              )}
            </div>
            <div className="verification-badge">
              <IoCheckmarkCircle />
            </div>
            {isEditMode && (
              <label className="camera-button" htmlFor="profile-image-input">
                <IoCameraOutline />
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          <div className="profile-info">
            <h2 className="profile-name">{displayData.name || 'No Name'}</h2>
            <p className="business-name">{displayData.businessName || 'No Business Name'}</p>
            <div className="location-info">
              <IoLocationOutline className="location-icon" />
              <span className="location-text">{displayData.location || 'No Location'}</span>
            </div>
            <div className="rating-info">
              <IoStarOutline className="star-icon" />
              <span className="rating-value">{displayData.rating || 0}</span>
              <span className="review-count">({displayData.reviews || 0} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Section */}
      {displayData.bio && (
        <div className="card bio-card">
          <h3 className="bio-title">About Your Business</h3>
          <p className="bio-text">{displayData.bio}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        {profileStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="stat-card-profile">
              <div className="stat-icon-profile" style={{ backgroundColor: stat.color + '20', color: stat.color }}>
                <IconComponent />
              </div>
              <div className="stat-content-profile">
                <div className="stat-value-profile">{stat.value}</div>
                <div className="stat-label-profile">{stat.label}</div>
                <div className="stat-description-profile">{stat.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Profile Form */}
      <div className="card">
        <div className="profile-section">
          <h2>Company Information</h2>
          
          <div className="form-group">
            <label>Full Name</label>
            {isEditMode ? (
              <input 
                type="text" 
                value={displayData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            ) : (
              <div className="field-value">{displayData.name}</div>
            )}
          </div>

          <div className="form-group">
            <label>Business Name</label>
            {isEditMode ? (
              <input 
                type="text" 
                value={displayData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Enter business name"
              />
            ) : (
              <div className="field-value">{displayData.businessName}</div>
            )}
          </div>

          <div className="form-group">
            <label>Email Address</label>
            {isEditMode ? (
              <input 
                type="email" 
                value={displayData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled
                title="Email cannot be changed"
              />
            ) : (
              <div className="field-value">{displayData.email}</div>
            )}
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            {isEditMode ? (
              <input 
                type="tel" 
                value={displayData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+91 9876543210"
              />
            ) : (
              <div className="field-value">{displayData.phone}</div>
            )}
          </div>

          <div className="form-group">
            <label>Location</label>
            {isEditMode ? (
              <input 
                type="text" 
                value={displayData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, State"
              />
            ) : (
              <div className="field-value">{displayData.location}</div>
            )}
          </div>

          <div className="form-group">
            <label>About Your Business</label>
            {isEditMode ? (
              <textarea 
                rows="4" 
                value={displayData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Describe your business and services"
              />
            ) : (
              <div className="field-value textarea-value">{displayData.bio}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
