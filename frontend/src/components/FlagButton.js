import React, { useState } from 'react';
import { flagAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './FlagButton.css';

const FlagButton = ({ listingId, onFlagged }) => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [flagData, setFlagData] = useState({
    reason: 'suspicious',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleFlag = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to flag listings');
      return;
    }

    setLoading(true);
    try {
      await flagAPI.flagListing(listingId, flagData.reason, flagData.description, user.id);
      setShowModal(false);
      setFlagData({ reason: 'suspicious', description: '' });
      if (onFlagged) onFlagged();
      alert('Listing flagged successfully. Admin will review it shortly.');
    } catch (error) {
      console.error('Error flagging listing:', error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('already flagged')) {
        alert('You have already flagged this listing');
      } else {
        alert('Failed to flag listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <button 
        onClick={() => alert('Please log in to flag listings')} 
        className="flag-btn login-required"
      >
        <i className="fas fa-flag"></i>
        Flag Listing
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="flag-btn">
        <i className="fas fa-flag"></i>
        Flag Listing
      </button>

      {showModal && (
        <div className="flag-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="flag-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flag-modal-header">
              <h3>🚩 Flag Listing</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="close-btn"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleFlag} className="flag-form">
              <div className="form-group">
                <label className="form-label">Reason for flagging:</label>
                <select 
                  value={flagData.reason}
                  onChange={(e) => setFlagData({...flagData, reason: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="scam">Scam/Fraud</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="fake">Fake/Misleading Listing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Additional details (optional):</label>
                <textarea 
                  value={flagData.description}
                  onChange={(e) => setFlagData({...flagData, description: e.target.value})}
                  className="form-textarea"
                  placeholder="Please provide more details about why you're flagging this listing..."
                  rows="3"
                />
              </div>

              <div className="flag-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      <div className="spinner-small"></div>
                      Flagging...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-flag"></i>
                      Flag Listing
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FlagButton;