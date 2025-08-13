import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Functions
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const userAPI = {
  getProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

export const listingsAPI = {
  getAll: async (category, limit = 20, skip = 0) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    
    const response = await api.get(`/listings?${params.toString()}`);
    return response.data;
  },

  getById: async (listingId) => {
    const response = await api.get(`/listings/${listingId}`);
    return response.data;
  },

  create: async (listingData, userId) => {
    const response = await api.post(`/listings?user_id=${userId}`, listingData);
    return response.data;
  },

  getUserListings: async (userId) => {
    const response = await api.get(`/users/${userId}/listings`);
    return response.data;
  },

  update: async (listingId, listingData, userId) => {
    const response = await api.put(`/listings/${listingId}?user_id=${userId}`, listingData);
    return response.data;
  },

  delete: async (listingId, userId) => {
    await api.delete(`/listings/${listingId}?user_id=${userId}`);
  },

  search: async (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/search?${searchParams.toString()}`);
    return response.data;
  },
};

export const messagesAPI = {
  send: async (messageData, senderId) => {
    const response = await api.post(`/messages?sender_id=${senderId}`, messageData);
    return response.data;
  },

  getConversations: async (userId) => {
    const response = await api.get(`/users/${userId}/conversations`);
    return response.data;
  },

  getConversationMessages: async (listingId, otherUserId, userId) => {
    const response = await api.get(`/conversations/${listingId}/${otherUserId}/messages?user_id=${userId}`);
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  // Get all users
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Get admin statistics
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get admin notifications
  getNotifications: async (unreadOnly = false, limit = 50) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread_only', 'true');
    params.append('limit', limit.toString());
    
    const response = await api.get(`/admin/notifications?${params.toString()}`);
    return response.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.patch(`/admin/notifications/${notificationId}/read`);
    return response.data;
  },

  // Get all listings with admin info
  getListings: async (status = 'all', category = null, search = null, limit = 50, skip = 0) => {
    const params = new URLSearchParams();
    params.append('status', status);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    
    const response = await api.get(`/admin/listings?${params.toString()}`);
    return response.data;
  },

  // Perform admin action on listing
  listingAction: async (listingId, action, reason, notes = null) => {
    const response = await api.post(`/admin/listings/${listingId}/action`, {
      action,
      reason,
      notes
    });
    return response.data;
  },

  // Get flags summary
  getFlagsSummary: async () => {
    const response = await api.get('/admin/flags/summary');
    return response.data;
  },
};

// Flag listing API (for regular users)
export const flagAPI = {
  flagListing: async (listingId, reason, description = null, userId) => {
    const response = await api.post(`/listings/${listingId}/flag?current_user_id=${userId}`, {
      reason,
      description
    });
    return response.data;
  },
};

export default api;