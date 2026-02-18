import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Input.scss';

const Input = ({ 
  label, 
  type = 'text', 
  error, 
  ...props 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <div className="input-container">
        <input 
          type={isPassword && showPassword ? 'text' : type}
          className="input-field" 
          {...props} 
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;

