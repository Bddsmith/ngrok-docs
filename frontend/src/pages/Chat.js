import React from 'react';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const { listingId, userId } = useParams();

  return (
    <div className="page-container">
      <div className="container-sm">
        <div className="page-header">
          <h1 className="page-title">Chat</h1>
          <p className="page-subtitle">
            Conversation about listing
          </p>
        </div>

        <div className="empty-state">
          <i className="fas fa-comments"></i>
          <h3>Chat Feature Coming Soon</h3>
          <p>
            The real-time chat functionality will be available in the next update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;