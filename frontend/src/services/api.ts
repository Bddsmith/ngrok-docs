import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const backendUrl = Constants.expoConfig?.extra?.backendUrl || process.env.EXPO_BACKEND_URL;

// Create axios instance
const api = axios.create({
  baseURL: `${backendUrl}/api`,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'poultry' | 'coop' | 'cage';
  price: number;
  images: string[];
  location: string;
  breed?: string;
  age?: string;
  health_status?: string;
  size?: string;
  material?: string;
  condition?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateListingData {
  title: string;
  description: string;
  category: 'poultry' | 'coop' | 'cage';
  price: number;
  images: string[];
  location: string;
  breed?: string;
  age?: string;
  health_status?: string;
  size?: string;
  material?: string;
  condition?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  listing_id: string;
  listing_title: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

// API Functions
export const authAPI = {
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    location: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

export const userAPI = {
  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
};

export const listingsAPI = {
  getAll: async (category?: string, limit = 20, skip = 0): Promise<Listing[]> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    
    const response = await api.get(`/listings?${params.toString()}`);
    return response.data;
  },

  getById: async (listingId: string): Promise<Listing> => {
    const response = await api.get(`/listings/${listingId}`);
    return response.data;
  },

  create: async (listingData: CreateListingData, userId: string): Promise<Listing> => {
    const response = await api.post(`/listings?user_id=${userId}`, listingData);
    return response.data;
  },

  getUserListings: async (userId: string): Promise<Listing[]> => {
    const response = await api.get(`/users/${userId}/listings`);
    return response.data;
  },

  update: async (listingId: string, listingData: CreateListingData, userId: string): Promise<Listing> => {
    const response = await api.put(`/listings/${listingId}?user_id=${userId}`, listingData);
    return response.data;
  },

  delete: async (listingId: string, userId: string): Promise<void> => {
    await api.delete(`/listings/${listingId}?user_id=${userId}`);
  },

  search: async (params: {
    q?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
    limit?: number;
    skip?: number;
  }): Promise<Listing[]> => {
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
  send: async (messageData: {
    receiver_id: string;
    listing_id: string;
    content: string;
  }, senderId: string): Promise<Message> => {
    const response = await api.post(`/messages?sender_id=${senderId}`, messageData);
    return response.data;
  },

  getConversations: async (userId: string): Promise<Conversation[]> => {
    const response = await api.get(`/users/${userId}/conversations`);
    return response.data;
  },

  getConversationMessages: async (
    listingId: string,
    otherUserId: string,
    userId: string
  ): Promise<Message[]> => {
    const response = await api.get(`/conversations/${listingId}/${otherUserId}/messages?user_id=${userId}`);
    return response.data;
  },
};

export default api;