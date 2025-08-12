import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
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

export default api;