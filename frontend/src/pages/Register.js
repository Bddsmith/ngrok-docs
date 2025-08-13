import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.phone || !formData.location) {
      setError('Please fill in all fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    // Enhanced password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/(?=.*[a-z])/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/(?=.*\d)/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    const requirements = [
      { test: password.length >= 8, text: 'At least 8 characters' },
      { test: /(?=.*[a-z])/.test(password), text: 'One lowercase letter' },
      { test: /(?=.*[A-Z])/.test(password), text: 'One uppercase letter' },
      { test: /(?=.*\d)/.test(password), text: 'One number' }
    ];
    
    return requirements;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/');
    } else {
      // More specific error messages
      let errorMessage = result.error;
      
      // Check for common API error messages and make them user-friendly
      if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
      } else if (errorMessage.includes('validation')) {
        errorMessage = 'Please check that all fields are filled correctly and password requirements are met.';
      } else if (errorMessage.includes('network') || errorMessage.includes('failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage === 'Registration failed') {
        errorMessage = 'Registration failed. Please ensure your password meets all requirements and try again.';
      }
      
      setError(errorMessage);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join the poultry marketplace community</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <i className="fas fa-user"></i>
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-envelope"></i>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                <i className="fas fa-phone"></i>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-input"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">
                <i className="fas fa-map-marker-alt"></i>
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-input"
                placeholder="City, State"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              
              {/* Password Requirements */}
              <div className="password-requirements">
                <div className="requirements-header">
                  <i className="fas fa-shield-alt"></i>
                  Password Requirements:
                </div>
                <div className="requirements-list">
                  {getPasswordStrength(formData.password).map((req, index) => (
                    <div key={index} className={`requirement ${req.test ? 'met' : 'unmet'}`}>
                      <i className={`fas ${req.test ? 'fa-check' : 'fa-times'}`}></i>
                      {req.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <i className="fas fa-lock"></i>
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-submit-section">
            <div className="submit-reminder">
              <i className="fas fa-info-circle"></i>
              Make sure all password requirements above are met before submitting
            </div>
            
            <button
              type="submit"
              className={`btn btn-secondary auth-submit ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </>
              )}
            </button>
          </div>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="btn btn-outline auth-link">
            <i className="fas fa-sign-in-alt"></i>
            Sign In
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Register;