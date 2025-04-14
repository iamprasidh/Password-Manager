import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/Dashboard.css';

const PasswordForm = ({ initialData = {}, onSubmit, onCancel }) => {
  const generatePassword = () => {
    const length = 16;
    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let password = '';
    const allChars = Object.values(charset).join('');

    // Ensure at least one character from each set
    password += charset.uppercase[Math.floor(Math.random() * charset.uppercase.length)];
    password += charset.lowercase[Math.floor(Math.random() * charset.lowercase.length)];
    password += charset.numbers[Math.floor(Math.random() * charset.numbers.length)];
    password += charset.symbols[Math.floor(Math.random() * charset.symbols.length)];

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setFormData(prev => ({
      ...prev,
      password
    }));
  };

  const [formData, setFormData] = useState({
    title: initialData.title || '',
    username: initialData.username || '',
    password: initialData.password || '',
    website: initialData.website || '',
    notes: initialData.notes || ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getMasterPasswordRef } = useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate form
    if (!formData.title || !formData.username || !formData.password) {
      setError('Title, username, and password are required');
      setLoading(false);
      return;
    }

    // Get stored master password reference
    const mpRef = getMasterPasswordRef();
    if (!mpRef) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    // Decode master password reference for encryption
    const masterPasswordRef = decodeURIComponent(escape(atob(mpRef)));
    
    // Add master password to form data for encryption
    const dataWithMasterPassword = {
      ...formData,
      master_password: masterPasswordRef
    };

    const result = await onSubmit(dataWithMasterPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to save password. Please check your master password and try again.');
    }

  };

  return (
    <form className="password-form" onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Gmail, Facebook"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username/Email</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Your login username or email"
          required
        />
      </div>

      <div className="form-group password-input-group">
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Your password"
            required
          />
          <button 
            type="button" 
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
          <button
            type="button"
            className="generate-password-btn"
            onClick={generatePassword}
            title="Generate Strong Password"
          >
            Generate
          </button>
        </div>
      </div>



      <div className="form-group">
        <label htmlFor="website">Website (optional)</label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          placeholder="https://example.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional information"
          rows="3"
        ></textarea>
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Saving...' : initialData.id ? 'Update Password' : 'Save Password'}
        </button>
        {onCancel && (
          <button type="button" className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default PasswordForm;