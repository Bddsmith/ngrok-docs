import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listingsAPI } from '../services/api';
import './Browse.css';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'poultry', label: 'Poultry', icon: '🐔' },
  { key: 'coop', label: 'Coops', icon: '🏠' },
  { key: 'cage', label: 'Cages', icon: '🔲' },
];

const Browse = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const category = searchParams.get('category');
    if (category && CATEGORIES.find(c => c.key === category)) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsAPI.getAll(category);
      setListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadListings();
      return;
    }

    try {
      setLoading(true);
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsAPI.search({
        q: searchQuery,
        category,
      });
      setListings(data);
    } catch (error) {
      console.error('Error searching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="browse-page">
      <div className="container">
        <div className="browse-header">
          <h1 className="page-title">Browse Listings</h1>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search poultry, coops, cages..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                🔍
              </button>
            </div>
          </form>

          {/* Category Filters */}
          <div className="category-filters">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                onClick={() => handleCategoryChange(category.key)}
                className={`category-filter ${
                  selectedCategory === category.key ? 'active' : ''
                }`}
              >
                <span className="category-icon">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listings */}
        <div className="listings-container">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading listings...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="listings-grid">
              {listings.map((listing) => (
                <Link
                  key={listing.id || listing._id}
                  to={`/listing/${listing.id || listing._id}`}
                  className="listing-card"
                >
                  <div className="listing-header">
                    <span className="category-badge">
                      {listing.category}
                    </span>
                    <span className="price">${listing.price}</span>
                  </div>
                  
                  <h3 className="listing-title">{listing.title}</h3>
                  <p className="listing-description">
                    {listing.description}
                  </p>
                  
                  {/* Category-specific details */}
                  <div className="listing-details">
                    {listing.breed && (
                      <span className="detail-item">
                        🐾 {listing.breed}
                      </span>
                    )}
                    {listing.age && (
                      <span className="detail-item">
                        ⏰ {listing.age}
                      </span>
                    )}
                    {listing.size && (
                      <span className="detail-item">
                        📏 {listing.size}
                      </span>
                    )}
                  </div>
                  
                  <div className="listing-footer">
                    <span className="location">
                      📍 {listing.location}
                    </span>
                    <span className="date">
                      {formatDate(listing.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 className="empty-state-title">No listings found</h3>
              <p className="empty-state-text">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Be the first to post a listing!'
                }
              </p>
              <Link to="/create-listing" className="btn btn-primary">
                Create Listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Browse;