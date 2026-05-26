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

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const trimmedEmail = email.trim();
    const users: any[] = (mockData.users || []);
    const user = users.find(
      (u) =>
        String(u.email || '').toLowerCase() === trimmedEmail.toLowerCase() &&
        String((u as any).password || '') === String(password)
    );

    if (user) {
      // In a real app, we'd get a JWT token. Here we simulate it.
      const token = btoa(JSON.stringify(user));
      return { user, token };
    }
    
    throw new Error('Invalid email or password');
  },

  register: async (userData: Omit<User, 'id'> & { password: string }): Promise<AuthResponse> => {
    const users: any[] = (mockData.users || []);
    const exists = users.some((u) => String(u.email || '').toLowerCase() === String(userData.email).toLowerCase());
    if (exists) {
      throw new Error('Email already exists');
    }

    const user = {
      ...userData,
      id: Math.random().toString(36).substr(2, 9),
    } as any;
    // NOTE: this is a simple in-memory seed; persistence is handled in services/api.ts via localStorage.
    users.push(user);
    mockData.users = users;

    // If registering as a BUDDY, create a basic entry in the buddies collection
    if (user.role === 'BUDDY') {
      const buddies: any[] = (mockData.buddies || []);
      buddies.push({
        id: user.id,
        name: user.name,
        location: 'Vietnam',
        rating: 5.0,
        reviewCount: 0,
        languages: ['VIETNAMESE', 'ENGLISH'],
        description: 'New Local Buddy joined our community!',
        image: '/img/default-buddy.jpg',
        tags: ['New Member'],
        price: 15,
        availability: 'Available'
      });
      mockData.buddies = buddies;
    }

    const token = btoa(JSON.stringify(user));
    return { user, token };
  },

  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      return JSON.parse(userStr);
    }
    return null;
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
