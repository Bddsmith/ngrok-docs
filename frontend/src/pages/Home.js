import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Welcome to Poultry Marketplace
          </h1>
          <p className="hero-subtitle">
            The premier destination for buying and selling poultry, coops, cages, and fresh local eggs. 
            Connect with local farmers and enthusiasts in your area.
          </p>
          <div className="hero-buttons">
            <Link to="/browse" className="hero-btn hero-btn-primary">
              <i className="fas fa-search"></i>
              Browse Listings
            </Link>
            {user ? (
              <Link to="/create-listing" className="hero-btn hero-btn-secondary">
                <i className="fas fa-plus"></i>
                Create Listing
              </Link>
            ) : (
              <Link to="/register" className="hero-btn hero-btn-secondary">
                <i className="fas fa-user-plus"></i>
                Get Started
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="container">
          <div className="page-header">
            <h2 className="page-title">Browse by Category</h2>
            <p className="page-subtitle">
              Find exactly what you're looking for
            </p>
          </div>
          
          <div className="category-cards">
            <Link to="/browse?category=poultry" className="category-card">
              <span className="category-icon">🐔</span>
              <h3 className="category-name">Poultry</h3>
              <p className="category-count">Chickens, Ducks, Geese & More</p>
            </Link>
            
            <Link to="/browse?category=eggs" className="category-card">
              <span className="category-icon">🥚</span>
              <h3 className="category-name">Fresh Local Eggs</h3>
              <p className="category-count">Farm Fresh, Organic & Free-Range</p>
            </Link>
            
            <Link to="/browse?category=coop" className="category-card">
              <span className="category-icon">🏠</span>
              <h3 className="category-name">Coops</h3>
              <p className="category-count">Houses & Shelters</p>
            </Link>
            
            <Link to="/browse?category=cage" className="category-card">
              <span className="category-icon">🔲</span>
              <h3 className="category-name">Cages</h3>
              <p className="category-count">Transport & Display Cages</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="page-header">
            <h2 className="page-title">Why Choose Poultry Marketplace?</h2>
            <p className="page-subtitle">
              Everything you need for successful poultry trading
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-check"></i>
              </div>
              <h3 className="feature-title">Secure & Safe</h3>
              <p className="feature-description">
                All transactions are secure with verified user profiles and safe communication channels.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3 className="feature-title">Direct Communication</h3>
              <p className="feature-description">
                Chat directly with buyers and sellers to negotiate prices and arrange pickups.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <h3 className="feature-title">Local Focus</h3>
              <p className="feature-description">
                Find listings in your local area to reduce transport costs and support local farmers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">1,000+</span>
              <span className="stat-label">Active Listings</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Happy Users</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Cities Covered</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Support Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-description">
            Join thousands of poultry enthusiasts and start trading today!
          </p>
          <div className="hero-buttons">
            {user ? (
              <Link to="/create-listing" className="hero-btn hero-btn-primary">
                <i className="fas fa-plus"></i>
                Create Your First Listing
              </Link>
            ) : (
              <>
                <Link to="/register" className="hero-btn hero-btn-primary">
                  <i className="fas fa-user-plus"></i>
                  Sign Up Free
                </Link>
                <Link to="/browse" className="hero-btn hero-btn-secondary">
                  <i className="fas fa-search"></i>
                  Browse Listings
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;