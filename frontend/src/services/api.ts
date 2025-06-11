import axios from 'axios';
import { User, ServiceRequest } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: Partial<User> & { password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  }
};

// Service Request API
export const serviceRequestAPI = {
  createRequest: async (formData: FormData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending request data:', {
        data: formData,
        token: token.substring(0, 10) + '...',
        headers: {
          Authorization: `Bearer ${token.substring(0, 10)}...`,
          'Content-Type': 'application/json'
        }
      });

      const response = await axios.post(`${API_URL}/requests`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Request successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Create request error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        formData,
        headers: error.config?.headers
      });
      throw error;
    }
  },

  getMyRequests: async () => {
    const response = await api.get('/requests/my-requests');
    return response.data;
  },

  getAdminRequests: async () => {
    const response = await api.get('/requests/admin/requests');
    return response.data;
  },

  getRequest: async (id: string) => {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  addComment: async (id: string, text: string) => {
    const response = await api.post(`/requests/${id}/comments`, { text });
    return response.data;
  },

  updateStatus: async (id: string, status: ServiceRequest['status'], comment?: string) => {
    try {
      const response = await api.patch(`/requests/${id}/status`, { 
        status, 
        comment: comment || 'Status updated' 
      });
      return response.data;
    } catch (error: any) {
      console.error('Update status error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid status update');
      }
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to update status');
      }
      if (error.response?.status === 404) {
        throw new Error('Request not found');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to update status');
    }
  },

  getNearbyRequests: async (longitude: number, latitude: number, maxDistance?: number) => {
    const response = await api.get('/requests/nearby', {
      params: { longitude, latitude, maxDistance }
    });
    return response.data;
  },

  updateRequest: async (id: string, requestData: any) => {
    try {
      const response = await api.patch(`/requests/${id}`, requestData);
      return response.data;
    } catch (error: any) {
      console.error('Update request error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid request update');
      }
      if (error.response?.status === 403) {
        throw new Error('You are not authorized to update this request');
      }
      if (error.response?.status === 404) {
        throw new Error('Request not found');
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to update request');
    }
  }
};

// Admin API
export const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getAllRequests: async (params: {
    status?: ServiceRequest['status'];
    category?: ServiceRequest['category'];
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await api.get('/admin/requests', { params });
    return response.data;
  },

  assignStaff: async (requestId: string, staffId: string) => {
    const response = await api.post(`/admin/requests/${requestId}/assign`, { staffId });
    return response.data;
  },

  generateReport: async (params: {
    startDate?: string;
    endDate?: string;
    category?: ServiceRequest['category'];
  }) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
  },

  getStaffPerformance: async () => {
    const response = await api.get('/admin/staff-performance');
    return response.data;
  }
};

export default api; 