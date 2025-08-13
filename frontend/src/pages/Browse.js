import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { listingsAPI } from '../services/api';
import AdvancedSearch from '../components/AdvancedSearch';
import { RatingDisplay } from '../components/RatingSystem';
import { FollowButton } from '../components/FollowSystem';
import './Browse.css';

const Browse = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sellerRatings, setSellerRatings] = useState({});

  const categories = [
    { key: 'all', label: 'All Categories', icon: 'fas fa-th' },
    { key: 'poultry', label: 'Poultry', icon: 'fas fa-dove' },
    { key: 'eggs', label: 'Fresh Eggs', icon: 'fas fa-egg' },
    { key: 'coop', label: 'Coops', icon: 'fas fa-home' },
    { key: 'cage', label: 'Cages', icon: 'fas fa-square' },
  ];

  useEffect(() => {
    // Check for category in URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadListings();
  }, [selectedCategory]);

  // Load seller ratings for all listings
  const loadSellerRatings = async (listings) => {
    const ratings = {};
    const uniqueSellerIds = [...new Set(listings.map(listing => listing.user_id))];
    
    await Promise.all(
      uniqueSellerIds.map(async (sellerId) => {
        try {
          const backendURL = process.env.REACT_APP_BACKEND_URL || '';
          const response = await fetch(`${backendURL}/api/sellers/${sellerId}/rating-summary`);
          if (response.ok) {
            const ratingData = await response.json();
            ratings[sellerId] = ratingData;
          }
        } catch (error) {
          console.error(`Failed to load rating for seller ${sellerId}:`, error);
        }
      })
    );
    
    setSellerRatings(ratings);
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      setError('');
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsAPI.getAll(category);
      setListings(data);
      
      // Load seller ratings for the listings
      loadSellerRatings(data);
      
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchResults = (results) => {
    setListings(results);
    loadSellerRatings(results);
    setShowAdvancedSearch(false);
  };

  const handleAdvancedSearchClose = () => {
    setShowAdvancedSearch(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadListings();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsAPI.search({
        q: searchQuery,
        category,
      });
      setListings(data);
      loadSellerRatings(data);
    } catch (error) {
      console.error('Error searching listings:', error);
      setError('Failed to search listings. Please try again.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    // Update URL params
    if (category === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderListingCard = (listing) => (
    <Link to={`/listing/${listing.id || listing._id}`} key={listing.id || listing._id} className="listing-card">
      <div className="listing-image">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="listing-placeholder">
            <i className="fas fa-image"></i>
            <span>No Image</span>
          </div>
        )}
        <div className="listing-category">
          {listing.category}
        </div>
      </div>
      
      <div className="listing-content">
        <div className="listing-header">
          <h3 className="listing-title">{listing.title}</h3>
          <span className="listing-price">${listing.price}</span>
        </div>
        
        <p className="listing-description">
          {listing.description}
        </p>
        
        <div className="listing-details">
          {listing.breed && (
            <span className="listing-detail">
              <i className="fas fa-paw"></i>
              {listing.breed}
            </span>
          )}
          {listing.age && (
            <span className="listing-detail">
              <i className="fas fa-clock"></i>
              {listing.age}
            </span>
          )}
          {listing.size && (
            <span className="listing-detail">
              <i className="fas fa-expand-arrows-alt"></i>
              {listing.size}
            </span>
          )}
        </div>
        
        <div className="listing-footer">
          <div className="listing-info-left">
            <span className="listing-location">
              <i className="fas fa-map-marker-alt"></i>
              {listing.location}
            </span>
            <span className="listing-date">
              {formatDate(listing.created_at)}
            </span>
          </div>
          
          <div className="listing-seller-rating">
            {sellerRatings[listing.user_id] && (
              <RatingDisplay 
                averageRating={sellerRatings[listing.user_id].average_rating}
                totalRatings={sellerRatings[listing.user_id].total_ratings}
              />
            )}
            <div className="listing-follow-btn">
              <FollowButton 
                userId={listing.user_id}
                userName={listing.user_name || "Seller"}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="browse-page">
      <div className="browse-header">
        <div className="container">
          <h1 className="page-title">Browse Listings</h1>
          <p className="page-subtitle">
            Find the perfect poultry, fresh eggs, coops, and cages from local sellers
          </p>
        </div>
      </div>

      <div className="browse-filters">
        <div className="container">
          {/* Search Bar */}
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search for poultry, coops, cages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="search-input"
              />
              <button onClick={handleSearch} className="search-button">
                <i className="fas fa-search"></i>
                Search
              </button>
              <button 
                onClick={() => setShowAdvancedSearch(true)}
                className="advanced-search-button"
                title="Advanced Search"
              >
                <i className="fas fa-sliders-h"></i>
                Advanced
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category.key}
                className={`category-filter ${selectedCategory === category.key ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.key)}
              >
                <i className={category.icon}></i>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="browse-content">
        <div className="container">
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <h3>No listings found</h3>
              <p>
                {searchQuery 
                  ? 'Try adjusting your search terms or category filter' 
                  : 'Be the first to create a listing in this category!'
                }
              </p>
              <Link to="/create-listing" className="btn btn-primary">
                <i className="fas fa-plus"></i>
                Create Listing
              </Link>
            </div>
          ) : (
            <>
              <div className="results-header">
                <h2>{listings.length} listing{listings.length !== 1 ? 's' : ''} found</h2>
                {searchQuery && (
                  <p>Results for "{searchQuery}"</p>
                )}
              </div>
              
              <div className="listings-grid">
                {listings.map(renderListingCard)}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <AdvancedSearch 
          onResults={handleSearchResults}
          onClose={handleAdvancedSearchClose}
        />
      )}
    </div>
  );
};

export default Browse;