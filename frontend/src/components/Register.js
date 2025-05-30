import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Auth.css';

// Password strength indicator component
const PasswordStrengthMeter = ({ password }) => {
  const calculateStrength = (password) => {
    if (!password) return 0;
    
    let strength = 0;
    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
    if (/[a-z]/.test(password)) strength += 1; // Has lowercase
    if (/[0-9]/.test(password)) strength += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char
    
    return Math.min(strength, 5); // Max strength of 5
  };
  
  const strength = calculateStrength(password);
  const strengthText = [
    'Very Weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
    'Very Strong'
  ];
  
  const strengthClass = `strength-meter-${strength}`;
  
  return (
    <div className="password-strength-meter">
      <div className="strength-meter">
        {[...Array(5)].map((_, index) => (
          <div 
            key={index} 
            className={`strength-segment ${index < strength ? strengthClass : ''}`}
          />
        ))}
      </div>
      <div className="strength-text">{strengthText[strength]}</div>
    </div>
  );
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate inputs
    if (!email || !masterPassword || !confirmPassword) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (masterPassword.length < 8) {
      setError('Master password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    // Check password strength
    const hasUppercase = /[A-Z]/.test(masterPassword);
    const hasLowercase = /[a-z]/.test(masterPassword);
    const hasNumber = /[0-9]/.test(masterPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(masterPassword);

    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecial)) {
      setError('Master password must include uppercase, lowercase, numbers, and special characters');
      setIsLoading(false);
      return;
    }

    const result = await register(email, masterPassword);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form-container">
        <h2>Create an Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="masterPassword">Master Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="masterPassword"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Create a master password"
                required
              />
              <button 
                type="button" 
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <small className="password-hint">
              This is your encryption key. You cannot recover your passwords without it.
              Use a strong, memorable password with uppercase, lowercase, numbers, and special characters.
            </small>
            {masterPassword && <PasswordStrengthMeter password={masterPassword} />}
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Master Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your master password"
                required
              />
            </div>
          </div>
          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;