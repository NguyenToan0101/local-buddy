import { mockData } from '../mock/mockData';

export type UserRole = 'TRAVELER' | 'BUDDY';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  location?: string;
  age?: number;
  nationality?: string;
  languages?: string[];
  description?: string;
  interests?: string[];
  rating?: number;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export interface AuthResponse {
  user: User;
  token: string;
}

const API_BASE_URL = 'http://localhost:8080';

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Invalid email or password');
    }

    const data = await response.json(); // AuthResponse from backend (token, type, id, email, fullName, avatarUrl, role)
    const user: User = {
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role as UserRole,
      avatar: data.avatarUrl,
    };

    return { user, token: data.token };
  },

  register: async (userData: Omit<User, 'id'> & { password: string }): Promise<AuthResponse> => {
    // For registration, we can still fall back to mock or write a mock implementation,
    // but we can generate a basic response. Let's keep it compatible.
    const users: any[] = (mockData.users || []);
    const exists = users.some((u) => String(u.email || '').toLowerCase() === String(userData.email).toLowerCase());
    if (exists) {
      throw new Error('Email already exists');
    }

    const user = {
      ...userData,
      id: Math.random().toString(36).substring(2, 11),
    } as any;
    users.push(user);
    mockData.users = users;

    const token = btoa(JSON.stringify(user));
    return { user, token };
  },

  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  fetchMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role as UserRole,
      avatar: data.avatarUrl,
    };
  },

  updateProfile: async (id: string, userData: Partial<User>): Promise<User> => {
    const users: any[] = (mockData.users || []);
    const idx = users.findIndex((u) => String(u.id) === String(id));
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...userData };
    mockData.users = users;
    return users[idx] as User;
  }
};
