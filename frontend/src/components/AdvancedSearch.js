import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdvancedSearch.css';

const AdvancedSearch = ({ onResults, onClose }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  
  const [filters, setFilters] = useState({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min_price: '',
    max_price: '',
    location: '',
    radius_miles: '',
    // Eggs specific
    egg_type: '',
    feed_type: '',
    max_days_old: '',
    // Poultry specific
    breed: '',
    age_range: '',
    // Sorting
    sort_by: 'created_at',
    sort_order: 'desc',
    min_rating: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      // Clean up empty values
      const searchData = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      );
      
      // Convert numeric fields
      if (searchData.min_price) searchData.min_price = parseFloat(searchData.min_price);
      if (searchData.max_price) searchData.max_price = parseFloat(searchData.max_price);
      if (searchData.radius_miles) searchData.radius_miles = parseInt(searchData.radius_miles);
      if (searchData.max_days_old) searchData.max_days_old = parseInt(searchData.max_days_old);
      if (searchData.min_rating) searchData.min_rating = parseFloat(searchData.min_rating);

      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.post(`${backendURL}/api/advanced-search`, searchData);
      
      if (onResults) {
        onResults(response.data);
      }
      
      // Update URL with search parameters
      const urlParams = new URLSearchParams();
      Object.entries(searchData).forEach(([key, value]) => {
        if (value) urlParams.set(key, value.toString());
      });
      navigate(`/browse?${urlParams.toString()}`);
      
    } catch (error) {
      console.error('Advanced search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: '',
      min_price: '',
      max_price: '',
      location: '',
      radius_miles: '',
      egg_type: '',
      feed_type: '',
      max_days_old: '',
      breed: '',
      age_range: '',
      sort_by: 'created_at',
      sort_order: 'desc',
      min_rating: ''
    });
  };

  return (
    <div className="advanced-search-overlay">
      <div className="advanced-search-modal">
        <div className="search-header">
          <h2>
            <i className="fas fa-search-plus"></i>
            Advanced Search
          </h2>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSearch} className="advanced-search-form">
          {/* Basic Search */}
          <div className="search-section">
            <h3>Basic Search</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Search Keywords</label>
                <input
                  type="text"
                  name="query"
                  placeholder="What are you looking for?"
                  value={filters.query}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={filters.category} onChange={handleInputChange}>
                  <option value="">All Categories</option>
                  <option value="poultry">Poultry</option>
                  <option value="eggs">Fresh Eggs</option>
                  <option value="coop">Coops</option>
                  <option value="cage">Cages</option>
                </select>
              </div>
            </div>
          </div>

          {/* Price & Location */}
          <div className="search-section">
            <h3>Price & Location</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Min Price ($)</label>
                <input
                  type="number"
                  name="min_price"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.min_price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Max Price ($)</label>
                <input
                  type="number"
                  name="max_price"
                  min="0"
                  step="0.01"
                  placeholder="1000.00"
                  value={filters.max_price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* Category-Specific Filters */}
          {filters.category === 'eggs' && (
            <div className="search-section">
              <h3>🥚 Eggs Filters</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Egg Type</label>
                  <select name="egg_type" value={filters.egg_type} onChange={handleInputChange}>
                    <option value="">Any Type</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Duck">Duck</option>
                    <option value="Quail">Quail</option>
                    <option value="Goose">Goose</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Feed Type</label>
                  <select name="feed_type" value={filters.feed_type} onChange={handleInputChange}>
                    <option value="">Any Feed</option>
                    <option value="Organic">Organic Certified</option>
                    <option value="Pasture">Pasture-Raised</option>
                    <option value="Free-Range">Free-Range</option>
                    <option value="Cage-Free">Cage-Free</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Max Days Old</label>
                  <select name="max_days_old" value={filters.max_days_old} onChange={handleInputChange}>
                    <option value="">Any Age</option>
                    <option value="1">Today Only</option>
                    <option value="3">3 Days or Newer</option>
                    <option value="7">1 Week or Newer</option>
                    <option value="14">2 Weeks or Newer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {filters.category === 'poultry' && (
            <div className="search-section">
              <h3>🐔 Poultry Filters</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Breed</label>
                  <input
                    type="text"
                    name="breed"
                    placeholder="Rhode Island Red, Leghorn..."
                    value={filters.breed}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Age Range</label>
                  <select name="age_range" value={filters.age_range} onChange={handleInputChange}>
                    <option value="">Any Age</option>
                    <option value="chick">Chicks (0-8 weeks)</option>
                    <option value="young">Young (2-6 months)</option>
                    <option value="adult">Adult (6+ months)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Quality & Sorting */}
          <div className="search-section">
            <h3>Quality & Sorting</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Min Seller Rating</label>
                <select name="min_rating" value={filters.min_rating} onChange={handleInputChange}>
                  <option value="">Any Rating</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="3.0">3.0+ Stars</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sort By</label>
                <select name="sort_by" value={filters.sort_by} onChange={handleInputChange}>
                  <option value="created_at">Newest First</option>
                  <option value="price">Price</option>
                  <option value="rating">Seller Rating</option>
                  <option value="title">Name (A-Z)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Sort Order</label>
                <select name="sort_order" value={filters.sort_order} onChange={handleInputChange}>
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="search-actions">
            <button type="button" onClick={clearFilters} className="btn btn-outline">
              <i className="fas fa-eraser"></i>
              Clear All
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSearching}>
              {isSearching ? (
                <>
                  <div className="spinner"></div>
                  Searching...
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedSearch;