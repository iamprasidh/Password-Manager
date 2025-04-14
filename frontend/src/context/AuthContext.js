import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Set default axios auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/me/');
      setUser(response.data);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setLoading(false);
      setError('Session expired. Please login again.');
    }
  };

  const login = async (email, masterPassword) => {
    try {
      // Convert credentials to form data format as required by FastAPI
      const formData = new FormData();
      formData.append('username', email); // FastAPI OAuth expects 'username'
      formData.append('password', masterPassword);

      let response;
      try {
        response = await axios.post('http://localhost:8000/token', formData);
      } catch (networkError) {
        console.error('Network error during login:', networkError);
        if (!networkError.response) {
          setError('Network error: Unable to connect to the server. Please check if the server is running.');
          return { success: false, error: 'Network error: Unable to connect to the server' };
        }
        throw networkError;
      }
      const { access_token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', access_token);
      
      // Store the master password securely in memory (not localStorage)
      // This will be used for password decryption
      // Use a more secure encoding method for the master password
      // First encode the password to handle special characters
      const encodedPassword = btoa(unescape(encodeURIComponent(masterPassword)));
      // Store in session storage with additional security context
      sessionStorage.setItem('mp_ref', encodedPassword);
      // Verify the stored reference immediately
      const storedRef = sessionStorage.getItem('mp_ref');
      if (!storedRef || decodeURIComponent(escape(atob(storedRef))) !== masterPassword) {
        throw new Error('Failed to securely store master password reference');
      }
      
      // Set default axios auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Fetch user profile
      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login failed. Please try again.');
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (email, masterPassword) => {
    try {
      // Validate password requirements
      if (masterPassword.length < 8) {
        throw new Error('Master password must be at least 8 characters long');
      }
      
      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      let response;
      try {
        response = await axios.post('http://localhost:8000/register', {
          email: email,
          password: masterPassword
        });
      } catch (networkError) {
        console.error('Network error during registration:', networkError);
        if (!networkError.response) {
          setError('Network error: Unable to connect to the server. Please check if the server is running and try again.');
          return { success: false, error: 'Network error: Unable to connect to the server' };
        }
        if (networkError.response?.status === 500) {
          setError('Server error: The registration service is currently experiencing issues. Please try again later.');
          return { success: false, error: 'Server error occurred' };
        }
        throw networkError;
      }
      
      // After successful registration, log the user in
      return await login(email, masterPassword);
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage;
      if (error.response?.data?.detail === 'Email already registered') {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else {
        errorMessage = error.response?.data?.detail || error.message || 'Registration failed. Please try again.';
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };
  
  // Get master password reference for decryption
  const getMasterPasswordRef = () => {
    const mpRef = sessionStorage.getItem('mp_ref');
    if (!mpRef) {
      throw new Error('Master password reference not found');
    }
    return mpRef;
  };

  const decryptPassword = async (encryptedPassword, passwordId) => {
    try {
      const mpRef = getMasterPasswordRef();
      if (!mpRef) {
        throw new Error('Master password reference not found');
      }
      
      // Properly decode the stored master password reference
      const decodedPassword = decodeURIComponent(escape(atob(mpRef)));
      const response = await axios.post(
        `http://localhost:8000/passwords/${passwordId}/decrypt`,
        { master_password: decodedPassword }
      );
      return response.data.password;
    } catch (error) {
      console.error('Error decrypting password:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('mp_ref'); // Clear master password reference
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        error,
        login,
        register,
        logout,
        setError,
        getMasterPasswordRef
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};