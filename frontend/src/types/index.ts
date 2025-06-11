export interface User {
  _id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  role: 'citizen' | 'admin' | 'staff';
  isVerified: boolean;
  createdAt: string;
}

export interface ServiceRequest {
  _id: string;
  title: string;
  description: string;
  category: 'pothole' | 'streetlight' | 'garbage' | 'water' | 'sewage' | 'other';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  estimatedResponseTime: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
  };
  attachments: Array<{
    type: 'image' | 'video' | 'document';
    url: string;
    originalname: string;
    mimetype: string;
    size: number;
    uploadedAt: string;
  }>;
  citizen: User;
  assignedTo: string | null;
  comments: Array<{
    user: User;
    text: string;
    createdAt: string;
  }>;
  statusHistory: Array<{
    status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
    changedBy: User;
    comment: string;
    timestamp: string;
  }>;
  estimatedCompletionDate?: string;
  actualCompletionDate?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ServiceRequestState {
  requests: ServiceRequest[];
  currentRequest: ServiceRequest | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  resolvedRequests: number;
  rejectedRequests: number;
  totalUsers: number;
  requestsByCategory: Array<{
    _id: string;
    count: number;
  }>;
  avgResolutionTime: number;
}

export interface StaffPerformance {
  staff: {
    id: string;
    name: string;
    email: string;
  };
  metrics: {
    totalAssigned: number;
    resolved: number;
    pending: number;
    inProgress: number;
    avgResolutionTime: number;
  };
} 