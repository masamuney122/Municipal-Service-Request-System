export interface User {
  _id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'citizen' | 'staff';
  createdAt: string;
  updatedAt: string;
} 