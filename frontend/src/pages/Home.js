import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Poultry Marketplace</h1>
            <p className="hero-subtitle">Buy & Sell Poultry, Coops & Cages</p>
            {user && (
              <p className="welcome-text">Welcome back, {user.name}!</p>
            )}
            <div className="hero-actions">
              <Link to="/browse" className="btn btn-primary btn-lg">
                Browse Listings
              </Link>
              <Link to="/create-listing" className="btn btn-secondary btn-lg">
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="quick-actions">
        <div className="container">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-grid">
            <Link to="/browse" className="action-card">
              <div className="action-icon">🔍</div>
              <h3 className="action-title">Browse Listings</h3>
              <p className="action-description">Find poultry, coops, and cages in your area</p>
            </Link>
            
            <Link to="/create-listing" className="action-card">
              <div className="action-icon">➕</div>
              <h3 className="action-title">Create Listing</h3>
              <p className="action-description">List your poultry or equipment for sale</p>
            </Link>
            
            <Link to="/messages" className="action-card">
              <div className="action-icon">💬</div>
              <h3 className="action-title">Messages</h3>
              <p className="action-description">Chat with buyers and sellers</p>
            </Link>
            
            <Link to={user ? "/profile" : "/login"} className="action-card">
              <div className="action-icon">👤</div>
              <h3 className="action-title">{user ? "Profile" : "Login"}</h3>
              <p className="action-description">
                {user ? "Manage your account and listings" : "Sign in to your account"}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="container">
          <h2 className="section-title">Categories</h2>
          <div className="category-grid">
            <Link to="/browse?category=poultry" className="category-card">
              <div className="category-icon">🐔</div>
              <h3 className="category-title">Poultry</h3>
              <p className="category-description">Chickens, ducks, geese, and more</p>
            </Link>
            
            <Link to="/browse?category=coop" className="category-card">
              <div className="category-icon">🏠</div>
              <h3 className="category-title">Coops</h3>
              <p className="category-description">Chicken coops and housing</p>
            </Link>
            
            <Link to="/browse?category=cage" className="category-card">
              <div className="category-icon">🔲</div>
              <h3 className="category-title">Cages</h3>
              <p className="category-description">Cages and enclosures</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose Our Marketplace?</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Secure Transactions</h3>
              <p className="feature-description">
                Safe and secure platform for buying and selling
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Direct Communication</h3>
              <p className="feature-description">
                Chat directly with buyers and sellers
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📍</div>
              <h3 className="feature-title">Local Marketplace</h3>
              <p className="feature-description">
                Find listings in your area for easy pickup
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-text">
              {user 
                ? "Create your first listing or browse what's available in your area!"
                : "Join our community of poultry enthusiasts today!"
              }
            </p>
            <Link 
              to={user ? "/create-listing" : "/register"} 
              className="btn btn-primary btn-lg"
            >
              {user ? "Create Listing" : "Get Started"}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;