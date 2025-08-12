import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../services/api';
import './CreateListing.css';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'poultry',
    price: '',
    location: user?.location || '',
    // Poultry fields
    breed: '',
    age: '',
    health_status: '',
    // Coop/Cage fields
    size: '',
    material: '',
    condition: '',
  });
  
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { key: 'poultry', label: 'Poultry', icon: 'fas fa-dove' },
    { key: 'coop', label: 'Coop', icon: 'fas fa-home' },
    { key: 'cage', label: 'Cage', icon: 'fas fa-square' },
  ];

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="create-listing-page">
        <div className="container-sm">
          <div className="auth-required">
            <i className="fas fa-lock"></i>
            <h2>Authentication Required</h2>
            <p>You need to be logged in to create a listing.</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('You can upload a maximum of 5 images');
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter a description');
      return false;
    }
    if (!formData.price.trim() || isNaN(parseFloat(formData.price))) {
      setError('Please enter a valid price');
      return false;
    }
    if (!formData.location.trim()) {
      setError('Please enter a location');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const listingData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        price: parseFloat(formData.price),
        images: images,
        location: formData.location.trim(),
      };

      // Add category-specific fields
      if (formData.category === 'poultry') {
        if (formData.breed) listingData.breed = formData.breed.trim();
        if (formData.age) listingData.age = formData.age.trim();
        if (formData.health_status) listingData.health_status = formData.health_status.trim();
      } else {
        if (formData.size) listingData.size = formData.size.trim();
        if (formData.material) listingData.material = formData.material.trim();
        if (formData.condition) listingData.condition = formData.condition.trim();
      }

      const createdListing = await listingsAPI.create(listingData, user.id);
      navigate(`/listing/${createdListing.id || createdListing._id}`);
    } catch (error) {
      console.error('Error creating listing:', error);
      setError(error.response?.data?.detail || 'Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryFields = () => {
    if (formData.category === 'poultry') {
      return (
        <div className="category-fields">
          <h3 className="section-title">Poultry Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-paw"></i>
                Breed
              </label>
              <input
                type="text"
                name="breed"
                className="form-input"
                placeholder="e.g., Rhode Island Red, Leghorn"
                value={formData.breed}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-clock"></i>
                Age
              </label>
              <input
                type="text"
                name="age"
                className="form-input"
                placeholder="e.g., 6 months, 2 years"
                value={formData.age}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              <i className="fas fa-heart"></i>
              Health Status
            </label>
            <input
              type="text"
              name="health_status"
              className="form-input"
              placeholder="e.g., Excellent, Vaccinated"
              value={formData.health_status}
              onChange={handleInputChange}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="category-fields">
          <h3 className="section-title">{formData.category === 'coop' ? 'Coop' : 'Cage'} Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-expand-arrows-alt"></i>
                Size
              </label>
              <input
                type="text"
                name="size"
                className="form-input"
                placeholder="e.g., 4x4 feet, Large"
                value={formData.size}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <i className="fas fa-hammer"></i>
                Material
              </label>
              <input
                type="text"
                name="material"
                className="form-input"
                placeholder="e.g., Wood, Metal, Wire"
                value={formData.material}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              <i className="fas fa-star"></i>
              Condition
            </label>
            <select
              name="condition"
              className="form-select"
              value={formData.condition}
              onChange={handleInputChange}
            >
              <option value="">Select condition</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Needs Repair">Needs Repair</option>
            </select>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="create-listing-page">
      <div className="page-container">
        <div className="container-sm">
          <div className="page-header">
            <h1 className="page-title">Create New Listing</h1>
            <p className="page-subtitle">
              List your poultry, coops, or cages for sale
            </p>
          </div>

          <form onSubmit={handleSubmit} className="listing-form">
            {error && (
              <div className="alert alert-error">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {/* Category Selection */}
            <div className="form-section">
              <h3 className="section-title">Category</h3>
              <div className="category-selector">
                {categories.map((category) => (
                  <label key={category.key} className="category-option">
                    <input
                      type="radio"
                      name="category"
                      value={category.key}
                      checked={formData.category === category.key}
                      onChange={handleInputChange}
                    />
                    <div className="category-card-option">
                      <i className={category.icon}></i>
                      <span>{category.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-tag"></i>
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="Enter a descriptive title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <i className="fas fa-align-left"></i>
                  Description *
                </label>
                <textarea
                  name="description"
                  className="form-input form-textarea"
                  placeholder="Provide details about your listing"
                  rows="4"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-dollar-sign"></i>
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <i className="fas fa-map-marker-alt"></i>
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="form-input"
                    placeholder="City, State"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category-specific fields */}
            {renderCategoryFields()}

            {/* Images */}
            <div className="form-section">
              <h3 className="section-title">Photos</h3>
              <div className="image-upload-section">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                />
                <label htmlFor="image-upload" className="image-upload-label">
                  <i className="fas fa-camera"></i>
                  <span>Add Photos</span>
                  <small>You can add up to 5 photos</small>
                </label>
              </div>

              {images.length > 0 && (
                <div className="image-preview-grid">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img src={image} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`btn btn-primary submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Creating Listing...
                </>
              ) : (
                <>
                  <i className="fas fa-plus"></i>
                  Create Listing
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;