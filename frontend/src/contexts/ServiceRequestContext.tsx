import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ServiceRequest, ServiceRequestState } from '../types';
import { serviceRequestAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const initialState: ServiceRequestState = {
  requests: [],
  currentRequest: null,
  loading: false,
  error: null
};

type ServiceRequestAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_REQUESTS'; payload: ServiceRequest[] }
  | { type: 'SET_CURRENT_REQUEST'; payload: ServiceRequest }
  | { type: 'ADD_REQUEST'; payload: ServiceRequest }
  | { type: 'UPDATE_REQUEST'; payload: ServiceRequest }
  | { type: 'ADD_COMMENT'; payload: { requestId: string; comment: ServiceRequest['comments'][0] } };

const serviceRequestReducer = (
  state: ServiceRequestState,
  action: ServiceRequestAction
): ServiceRequestState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_REQUESTS':
      return {
        ...state,
        requests: action.payload,
        loading: false
      };
    case 'SET_CURRENT_REQUEST':
      return {
        ...state,
        currentRequest: action.payload,
        loading: false
      };
    case 'ADD_REQUEST':
      return {
        ...state,
        requests: [action.payload, ...state.requests],
        loading: false
      };
    case 'UPDATE_REQUEST':
      return {
        ...state,
        requests: state.requests.map((request) =>
          request._id === action.payload._id ? action.payload : request
        ),
        currentRequest:
          state.currentRequest?._id === action.payload._id
            ? action.payload
            : state.currentRequest,
        loading: false
      };
    case 'ADD_COMMENT':
      return {
        ...state,
        currentRequest: state.currentRequest
          ? {
              ...state.currentRequest,
              comments: [...state.currentRequest.comments, action.payload.comment]
            }
          : null,
        loading: false
      };
    default:
      return state;
  }
};

export interface ServiceRequestContextType {
  requests: ServiceRequest[];
  currentRequest: ServiceRequest | null;
  loading: boolean;
  error: string | null;
  getMyRequests: () => Promise<void>;
  getAdminRequests: () => Promise<void>;
  getRequest: (id: string) => Promise<void>;
  createRequest: (requestData: FormData) => Promise<void>;
  updateRequest: (id: string, requestData: any) => Promise<void>;
  addComment: (id: string, text: string) => Promise<void>;
  updateStatus: (id: string, status: ServiceRequest['status'], comment?: string) => Promise<void>;
  getNearbyRequests: (longitude: number, latitude: number, maxDistance?: number) => Promise<void>;
  clearError: () => void;
}

const ServiceRequestContext = createContext<ServiceRequestContextType | undefined>(undefined);

export const ServiceRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(serviceRequestReducer, initialState);
  const { user } = useAuth();

  const getMyRequests = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const requests = user?.role === 'admin'
        ? await serviceRequestAPI.getAdminRequests()
        : await serviceRequestAPI.getMyRequests();
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to fetch requests'
      });
    }
  }, [user?.role]);

  const getAdminRequests = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const requests = await serviceRequestAPI.getAdminRequests();
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to fetch admin requests'
      });
    }
  }, []);

  const getRequest = useCallback(async (id: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = await serviceRequestAPI.getRequest(id);
      dispatch({ type: 'SET_CURRENT_REQUEST', payload: request });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to fetch request'
      });
    }
  }, []);

  const createRequest = useCallback(async (FormData: FormData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = await serviceRequestAPI.createRequest(FormData);
      dispatch({ type: 'ADD_REQUEST', payload: request });
    } catch (err: any) {
      console.error('Create request error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = 'Failed to create request';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch({
        type: 'SET_ERROR',
        payload: errorMessage
      });
      throw err;
    }
  }, []);

  const updateRequest = useCallback(async (id: string, requestData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await serviceRequestAPI.updateRequest(id, requestData);
      dispatch({ type: 'UPDATE_REQUEST', payload: response });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to update request'
      });
      throw err;
    }
  }, []);

  const addComment = useCallback(async (id: string, text: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = await serviceRequestAPI.addComment(id, text);
      dispatch({ type: 'UPDATE_REQUEST', payload: request });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to add comment'
      });
    }
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    status: ServiceRequest['status'],
    comment?: string
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const request = await serviceRequestAPI.updateStatus(id, status, comment);
      dispatch({ type: 'UPDATE_REQUEST', payload: request });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to update status'
      });
    }
  }, []);

  const getNearbyRequests = useCallback(async (longitude: number, latitude: number, maxDistance?: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const requests = await serviceRequestAPI.getNearbyRequests(longitude, latitude, maxDistance);
      dispatch({ type: 'SET_REQUESTS', payload: requests });
    } catch (err: any) {
      dispatch({
        type: 'SET_ERROR',
        payload: err.response?.data?.message || 'Failed to fetch nearby requests'
      });
    }
  }, []);

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  return (
    <ServiceRequestContext.Provider
      value={{
        ...state,
        getMyRequests,
        getAdminRequests,
        getRequest,
        createRequest,
        updateRequest,
        addComment,
        updateStatus,
        getNearbyRequests,
        clearError
      }}
    >
      {children}
    </ServiceRequestContext.Provider>
  );
};

export const useServiceRequest = () => {
  const context = useContext(ServiceRequestContext);
  if (context === undefined) {
    throw new Error('useServiceRequest must be used within a ServiceRequestProvider');
  }
  return context;
}; 