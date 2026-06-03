import { mockData } from '../mock/mockData';

export type UserRole = 'TRAVELER' | 'BUDDY' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  googleAvatar?: string;
  phone?: string;
  location?: string;
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

// const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = '/api';

const getDisplayAvatar = (data: any): string | undefined =>
  data.displayAvatarUrl || data.avatar || data.avatarUrl || data.googleAvatarUrl;

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
      avatar: getDisplayAvatar(data),
      googleAvatar: data.googleAvatarUrl,
      phone: data.phone,
      location: data.location,
      verificationStatus: data.verificationStatus,
    };

    return { user, token: data.token };
  },

  register: async (userData: Omit<User, 'id'> & { password: string }): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email.trim(),
        name: userData.name,
        password: userData.password,
        role: userData.role,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Registration failed');
    }

    const data = await response.json();

    if (data.type === 'OTP_SENT') {
      return {
        user: {
          id: '',
          email: data.email,
          name: data.fullName,
          role: data.role as UserRole,
        },
        token: 'OTP_SENT',
      };
    }

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role as UserRole,
      avatar: getDisplayAvatar(data),
      googleAvatar: data.googleAvatarUrl,
      location: data.location,
      verificationStatus: data.verificationStatus,
    };

    return { user, token: data.token };
  },

  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'OTP verification failed');
    }

    const data = await response.json();
    const user: User = {
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role as UserRole,
      avatar: getDisplayAvatar(data),
      googleAvatar: data.googleAvatarUrl,
      location: data.location,
      verificationStatus: data.verificationStatus,
    };

    return { user, token: data.token };
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
      avatar: getDisplayAvatar(data),
      googleAvatar: data.googleAvatarUrl,
      phone: data.phone,
      location: data.location,
      verificationStatus: data.verificationStatus,
    };
  },

  updateProfile: async (id: string, userData: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Failed to update profile');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.fullName,
      role: data.role as UserRole,
      avatar: getDisplayAvatar(data),
      googleAvatar: data.googleAvatarUrl,
      phone: data.phone,
      location: data.location,
      nationality: data.nationality,
      description: data.description,
      languages: data.languages,
      interests: data.interests,
      verificationStatus: data.verificationStatus
    };
  }
};
