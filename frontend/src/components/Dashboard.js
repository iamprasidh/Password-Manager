import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Dashboard.css';
import PasswordForm from './PasswordForm';
import PasswordItem from './PasswordItem';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPassword, setEditingPassword] = useState(null);

  // Fetch passwords on component mount
  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/passwords/');
      setPasswords(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching passwords:', err);
      setError('Failed to load passwords. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPassword = async (passwordData) => {
    try {
      const response = await axios.post('http://localhost:8000/passwords/', passwordData);
      setPasswords([...passwords, response.data]);
      setShowAddForm(false);
      return { success: true };
    } catch (err) {
      console.error('Error adding password:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Failed to add password. Please try again.'
      };
    }
  };

  const handleUpdatePassword = async (id, passwordData) => {
    try {
      const response = await axios.put(`http://localhost:8000/passwords/${id}`, passwordData);
      setPasswords(passwords.map(p => p.id === id ? response.data : p));
      setEditingPassword(null);
      return { success: true };
    } catch (err) {
      console.error('Error updating password:', err);
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Failed to update password. Please try again.'
      };
    }
  };

  const handleDeletePassword = async (id) => {
    if (window.confirm('Are you sure you want to delete this password?')) {
      try {
        await axios.delete(`http://localhost:8000/passwords/${id}`);
        setPasswords(passwords.filter(p => p.id !== id));
        return { success: true };
      } catch (err) {
        console.error('Error deleting password:', err);
        return { 
          success: false, 
          error: err.response?.data?.detail || 'Failed to delete password. Please try again.'
        };
      }
    }
  };

  const startEditing = (password) => {
    setEditingPassword(password);
    setShowAddForm(false);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>Welcome, {user?.email}</h2>
        <button className="logout-button" onClick={logout}>Logout</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-actions">
        <button 
          className="add-password-button" 
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingPassword(null);
          }}
        >
          {showAddForm ? 'Cancel' : 'Add New Password'}
        </button>
      </div>

      {showAddForm && (
        <div className="password-form-container">
          <h3>Add New Password</h3>
          <PasswordForm onSubmit={handleAddPassword} />
        </div>
      )}

      {editingPassword && (
        <div className="password-form-container">
          <h3>Edit Password</h3>
          <PasswordForm 
            initialData={editingPassword} 
            onSubmit={(data) => handleUpdatePassword(editingPassword.id, data)}
            onCancel={() => setEditingPassword(null)}
          />
        </div>
      )}

      <div className="passwords-list">
        <h3>Your Passwords</h3>
        {loading ? (
          <p>Loading passwords...</p>
        ) : passwords.length === 0 ? (
          <p>No passwords saved yet. Add your first password using the button above.</p>
        ) : (
          passwords.map(password => (
            <PasswordItem
              key={password.id}
              password={password}
              onEdit={() => startEditing(password)}
              onDelete={() => handleDeletePassword(password.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;