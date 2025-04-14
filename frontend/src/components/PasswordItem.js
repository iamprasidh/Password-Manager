import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Dashboard.css';

const PasswordItem = ({ password, onEdit, onDelete }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [showMasterInput, setShowMasterInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getMasterPasswordRef } = useContext(AuthContext);

  const handleShowPassword = async () => {
    if (showPassword) {
      // If already showing, just hide it
      setShowPassword(false);
      setPasswordValue('');
      return;
    }

    try {
      const mpRef = getMasterPasswordRef();
      if (!mpRef) {
        setError('Session expired. Please log in again.');
        return;
      }

      setLoading(true);
      setError(null);
      
      // Get the stored master password reference and use it directly
      const masterPasswordFromRef = decodeURIComponent(escape(atob(mpRef)));
      
      const response = await axios.post(
        `http://localhost:8000/passwords/${password.id}/decrypt`,
        { master_password: masterPasswordFromRef }
      );
      
      setPasswordValue(response.data.password);
      setShowPassword(true);
      setShowMasterInput(false); // Hide master password input if it was shown
    } catch (err) {
      console.error('Error decrypting password:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to decrypt password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const decryptPassword = async () => {
    if (!masterPassword) {
      setError('Please enter your master password');
      return;
    }

    try {
      setLoading(true);
      // Send master password to backend to decrypt the password
      const response = await axios.post(
        `http://localhost:8000/passwords/${password.id}/decrypt`,
        { master_password: masterPassword }
      );
      
      setPasswordValue(response.data.password);
      setShowPassword(true);
      setShowMasterInput(false);
      setError(null);
    } catch (err) {
      console.error('Error decrypting password:', err);
      setError(err.response?.data?.detail || 'Failed to decrypt password. Incorrect master password?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-item">
      {error && <div className="error-message">{error}</div>}
      
      <div className="password-item-header">
        <h4>{password.title}</h4>
        <div className="password-actions">
          <button className="edit-button" onClick={onEdit} title="Edit">
            Edit
          </button>
          <button className="delete-button" onClick={onDelete} title="Delete">
            Delete
          </button>
        </div>
      </div>
      
      {showMasterInput && (
        <div className="master-password-input">
          <input
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="Enter your master password"
          />
          <button 
            className="decrypt-button" 
            onClick={decryptPassword}
            disabled={loading}
          >
            {loading ? 'Decrypting...' : 'Decrypt'}
          </button>
        </div>
      )}
      
      <div className="password-details">
        <div className="detail-row">
          <span className="detail-label">Username:</span>
          <span className="detail-value">{password.username}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">Password:</span>
          <div className="password-value-container">
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                value={showPassword ? passwordValue : '••••••••'}
                readOnly
                className="password-display"
              />
              <button 
                className="toggle-password-btn"
                onClick={handleShowPassword}
                disabled={loading}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {loading ? 'Loading...' : showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
        </div>
        
        {password.website && (
          <div className="detail-row">
            <span className="detail-label">Website:</span>
            <a 
              href={password.website.startsWith('http') ? password.website : `https://${password.website}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="website-link"
            >
              {password.website}
            </a>
          </div>
        )}
        
        {password.notes && (
          <div className="detail-row">
            <span className="detail-label">Notes:</span>
            <span className="detail-value notes">{password.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordItem;