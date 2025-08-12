import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../services/api';
import './CreateListing.css';

const CATEGORIES = [
  { key: 'poultry', label: 'Poultry', icon: '🐔' },
  { key: 'coop', label: 'Coop', icon: '🏠' },
  { key: 'cage', label: 'Cage', icon: '🔲' },
];

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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setImages(prev => [...prev, event.target.result]);
        };
        reader.readAsDataURL(file);
      }
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
    
    if (!user) {
      setError('Please log in to create a listing');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
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

      await listingsAPI.create(listingData, user.id);
      navigate('/browse');
    } catch (error) {
      console.error('Error creating listing:', error);
      setError('Failed to create listing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryFields = () => {
    if (formData.category === 'poultry') {
      return (
        <>
          <div className="form-group">
            <label htmlFor="breed" className="form-label">Breed</label>
            <input
              type="text"
              id="breed"
              name="breed"
              value={formData.breed}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Rhode Island Red, Leghorn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age" className="form-label">Age</label>
            <input
              type="text"
              id="age"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., 6 months, 2 years"
            />
          </div>

          <div className="form-group">
            <label htmlFor="health_status" className="form-label">Health Status</label>
            <input
              type="text"
              id="health_status"
              name="health_status"
              value={formData.health_status}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Excellent, Vaccinated"
            />
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="form-group">
            <label htmlFor="size" className="form-label">Size</label>
            <input
              type="text"
              id="size"
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., 4x4 feet, Large"
            />
          </div>

          <div className="form-group">
            <label htmlFor="material" className="form-label">Material</label>
            <input
              type="text"
              id="material"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Wood, Metal, Wire"
            />
          </div>

          <div className="form-group">
            <label htmlFor="condition" className="form-label">Condition</label>
            <input
              type="text"
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Excellent, Good, Fair"
            />
          </div>
        </>
      );
    }
  };

  if (!user) {
    return (
      <div className="create-listing-page">
        <div className="container">
          <div className="login-prompt">
            <div className="login-prompt-icon">👤</div>
            <h2 className="login-prompt-title">Login Required</h2>
            <p className="login-prompt-text">Please log in to create a listing</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      <div className="container">
        <div className="create-listing-container">
          <h1 className="page-title">Create Listing</h1>
          
          <form onSubmit={handleSubmit} className="create-listing-form">
            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}

            {/* Category Selection */}
            <div className="form-section">
              <h3 className="section-title">Category</h3>
              <div className="category-selection">
                {CATEGORIES.map((category) => (
                  <label key={category.key} className="category-option">
                    <input
                      type="radio"
                      name="category"
                      value={category.key}
                      checked={formData.category === category.key}
                      onChange={handleInputChange}
                    />
                    <div className="category-option-content">
                      <span className="category-option-icon">{category.icon}</span>
                      <span className="category-option-label">{category.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title" className="form-label">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description" className="form-label">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input form-textarea"
                  placeholder="Provide details about your listing"
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="price" className="form-label">Price * ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location" className="form-label">Location *</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="City, State"
                  required
                />
              </div>
            </div>

            {/* Category-specific fields */}
            <div className="form-section">
              <h3 className="section-title">Additional Details</h3>
              {renderCategoryFields()}
            </div>

            {/* Images */}
            <div className="form-section">
              <h3 className="section-title">Photos</h3>
              <div className="image-upload-container">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="image-input"
                />
                <label htmlFor="images" className="image-upload-button">
                  📷 Add Photos
                </label>
                <p className="image-hint">You can add up to 5 photos</p>
                
                {images.length > 0 && (
                  <div className="image-preview-container">
                    {images.map((image, index) => (
                      <div key={index} className="image-preview">
                        <img src={image} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="image-remove-button"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-secondary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Listing...' : 'Create Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateListing;