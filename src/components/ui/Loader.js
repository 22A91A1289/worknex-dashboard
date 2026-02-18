import React from 'react';
import './Loader.scss';

const Loader = ({ fullPage = false, message = 'Loading...' }) => {
  return (
    <div className={`loader-container ${fullPage ? 'full-page' : ''}`}>
      <div className="loader-content">
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        {message && <p className="loader-message">{message}</p>}
      </div>
    </div>
  );
};

export default Loader;
