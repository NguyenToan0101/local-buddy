import { mockData } from '../mock/mockData';

type Db = Record<string, any>;
const DB_KEY = 'mock_db_v1';
const DB_SYNC_KEY = 'mock_db_v1_sync';
const MESSAGE_CHANNEL = 'local_buddy_messages';
// const API_BASE_URL = 'http://localhost:8080';
const API_BASE_URL = '/api';

function getWebSocketUrl(path: string) {
  const token = localStorage.getItem('token');
  const query = token ? `?token=${encodeURIComponent(token)}` : '';

  if (API_BASE_URL.startsWith('http')) {
    return `${API_BASE_URL.replace(/^http/, 'ws')}${path}${query}`;
  }

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}${API_BASE_URL}${path}${query}`;
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = localStorage.getItem('token');
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function emitDbChange(topic: string) {
  const payload = { topic, at: Date.now() };
  try {
    localStorage.setItem(DB_SYNC_KEY, JSON.stringify(payload));
  } catch {
    // Ignore sync failures in private browsing or restricted storage.
  }
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(MESSAGE_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  }
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function loadDb(): Db {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) return JSON.parse(raw);
  const seeded = clone(mockData);
  localStorage.setItem(DB_KEY, JSON.stringify(seeded));
  return seeded;
}

function saveDb(db: Db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function ensureArray(db: Db, key: string): any[] {
  if (!Array.isArray(db[key])) db[key] = [];
  return db[key];
}

function getById<T>(arr: T[], id: string) {
  return arr.find((x: any) => String(x.id) === String(id));
}

function patchById<T>(arr: T[], id: string, patch: any): T | null {
  const idx = arr.findIndex((x: any) => String(x.id) === String(id));
  if (idx === -1) return null;
  arr[idx] = { ...(arr[idx] as any), ...patch };
  return arr[idx] as any;
}

export interface Review {
  id: number;
  author: string;
  date: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface Buddy {
  id: string;
  name: string;
  age: number;
  location: string;
  rating: number;
  reviewCount: number;
  languages: string[];
  description: string;
  image: string;
  tags: string[];
  price: number;
  availability: string;
  interests?: string[];
  reviews?: Review[];
  phone?: string;
  idCardFront?: string;
  idCardBack?: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

type BuddySearchParams = {
  searchQuery?: string;
  tags?: string[];
  rating?: number;
  page?: number;
  size?: number;
};

type ExperienceSearchParams = {
  searchQuery?: string;
  tags?: string[];
  duration?: string | string[];
  rating?: number;
  page?: number;
  size?: number;
};

function appendSearchParam(params: URLSearchParams, key: string, value: unknown) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    const serialized = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(',');
    if (serialized) params.set(key, serialized);
    return;
  }
  const serialized = String(value).trim();
  if (serialized) params.set(key, serialized);
}

function normalizeBookingList(data: any) {
  return Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
}

export const buddyService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/buddies`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch buddies');
    }
    return await response.json() as Buddy[];
  },
  search: async (params: BuddySearchParams = {}) => {
    const query = new URLSearchParams();
    appendSearchParam(query, 'searchQuery', params.searchQuery);
    appendSearchParam(query, 'tags', params.tags);
    appendSearchParam(query, 'rating', params.rating);
    appendSearchParam(query, 'page', params.page ?? 0);
    appendSearchParam(query, 'size', params.size ?? 10);

    const response = await fetch(`${API_BASE_URL}/buddies/search?${query.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to search buddies');
    }
    return await response.json() as PageResponse<Buddy>;
  },
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch buddy profile');
    }
    return await response.json() as Buddy;
  },
  updateProfile: async (id: string, data: Partial<Buddy>) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update buddy profile');
    }
    return await response.json() as Buddy;
  },
};

export const bookingService = {
  getAll: async (page: number = 0, size: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/bookings?page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return normalizeBookingList(await response.json());
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Booking not found');
    return response.json();
  },
  create: async (bookingData: any) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    return response.json();
  },
  getMyBookings: async (page: number = 0, size: number = 10) => {
    const response = await fetch(`${API_BASE_URL}/bookings?page=${page}&size=${size}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch bookings');
    return normalizeBookingList(await response.json());
  },
  getByUserId: async (_userId: string, page: number = 0, size: number = 10) => {
    return bookingService.getMyBookings(page, size);
  },
  getByBuddyId: async (_buddyId: string, page: number = 0, size: number = 10) => {
    return bookingService.getMyBookings(page, size);
  },
  updateStatus: async (id: string, status: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update booking status');
    return response.json();
  },
  updateMeetupStatus: async (id: string, status: string | null) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/meetup-status`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update meetup status');
    return response.json();
  },
};

export const userService = {
  getMe: async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch current user');
    return response.json();
  },
  updateMe: async (payload: any) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update current user');
    return response.json();
  },
  getAll: async () => {
    const me = await userService.getMe();
    return [me];
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('User not found');
    return response.json();
  },
  patchById: async (id: string, patch: any) => {
    return userService.updateMe(patch);
  },
};

export const adminService = {
  getVerifications: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch verification records');
    return response.json();
  },
  getPendingBuddyVerifications: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/buddies/pending`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch pending buddy verifications');
    return response.json();
  },
  updateBuddyVerification: async (buddyId: string, status: 'pending' | 'verified' | 'rejected', reason?: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/buddies/${buddyId}/verification`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason }),
    });
    if (!response.ok) throw new Error('Failed to update buddy verification');
    return response.json();
  },
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch admin dashboard stats');
    return response.json();
  },
};

export const matchService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'matches'));
  },
};

export const earningService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/earnings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch earnings');
    return response.json();
  },
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/earnings/summary`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch earnings summary');
    return response.json();
  },
  getStats: async () => {
    return earningService.getAll();
  },
  setTransactions: async (transactions: any[]) => {
    return { transactions };
  },
  appendTransaction: async (tx: any) => {
    const earnings = await earningService.getAll();
    return {
      ...earnings,
      transactions: [...(earnings.transactions || []), tx],
    };
  },
};

export const transactionService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return response.json();
  },
  getByBuddyId: async (buddyId: string) => {
    return transactionService.getAll();
  },
};

export const messageService = {
  getConversations: async () => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },
  getOrCreateConversationByBuddyId: async (buddyId: string) => {
    const response = await fetch(`${API_BASE_URL}/conversations/buddy/${buddyId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  },
  getMessagesByConvId: async (convId: string) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${convId}/messages`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
  },
  sendMessage: async (convId: string, message: any) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        text: message.text || message.content,
        content: message.content,
        isOffer: message.isOffer,
        activity: message.activity,
        description: message.description,
        date: message.date,
        time: message.startTime || message.offerTime,
        duration: message.duration,
        guests: message.guests,
        location: message.location,
        hours: message.hours,
        price: message.price,
      }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },
  subscribe: (callback: () => void, onStatusChange?: (connected: boolean) => void) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return () => {};
    }

    let closedByClient = false;
    let retryTimer: ReturnType<typeof window.setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      const wsUrl = getWebSocketUrl('/ws/chat');
      socket = new WebSocket(wsUrl);

      socket.onopen = () => onStatusChange?.(true);
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'messages') {
            callback();
          }
        } catch {
          callback();
        }
      };
      socket.onclose = () => {
        onStatusChange?.(false);
        if (!closedByClient) {
          retryTimer = window.setTimeout(connect, 1500);
        }
      };
      socket.onerror = () => {
        onStatusChange?.(false);
        socket?.close();
      };
    };

    connect();

    return () => {
      closedByClient = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  },
};

export const requestService = {
  getPending: async () => {
    const db = loadDb();
    const req = ensureArray(db, 'requests');
    return clone(req.filter((r: any) => r.status === 'pending'));
  },
  updateStatus: async (id: string, status: string) => {
    const db = loadDb();
    const req = ensureArray(db, 'requests');
    const updated = patchById<any>(req, id, { status });
    if (!updated) throw new Error('Request not found');
    saveDb(db);
    return clone(updated);
  },
};

export interface Experience {
  id: string;
  title: string;
  travelerName: string;
  travelerAvatar?: string;
  image: string;
  location: string;
  date: string;
  tags: string[];
  storyContent: string;
  buddyId: string;
  buddyName: string;
  rating?: number;
  pinned?: boolean;
}

export const experienceService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/experiences`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch experiences');
    return response.json() as Promise<Experience[]>;
  },
  search: async (params: ExperienceSearchParams = {}) => {
    const query = new URLSearchParams();
    appendSearchParam(query, 'searchQuery', params.searchQuery);
    appendSearchParam(query, 'tags', params.tags);
    appendSearchParam(query, 'duration', params.duration);
    appendSearchParam(query, 'rating', params.rating);
    appendSearchParam(query, 'page', params.page ?? 0);
    appendSearchParam(query, 'size', params.size ?? 10);

    const response = await fetch(`${API_BASE_URL}/experiences/search?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to search experiences');
    return response.json() as Promise<PageResponse<Experience>>;
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Experience not found');
    return response.json() as Promise<Experience>;
  },
  getByBuddyId: async (buddyId: string) => {
    const response = await fetch(`${API_BASE_URL}/experiences?buddyId=${encodeURIComponent(buddyId)}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch buddy experiences');
    return response.json() as Promise<Experience[]>;
  },
  update: async (id: string, data: Partial<Experience>) => {
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update experience');
    return response.json() as Promise<Experience>;
  },
  create: async (data: Omit<Experience, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/experiences`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create experience');
    return response.json() as Promise<Experience>;
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/experiences/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete experience');
  },
};

export const notificationService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  },
  getById: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Notification not found');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create notification');
    return response.json();
  },
  markAsRead: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    return response.json();
  },
  delete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete notification');
  },
};

export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  status: string;
  title: string;
}

export const availabilityService = {
  fetchAvailabilities: async (buddyId: string): Promise<AvailabilitySlot[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${buddyId}/availabilities`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch availabilities');
    }
    return response.json();
  },

  addAvailability: async (buddyId: string, slot: Omit<AvailabilitySlot, 'id'>): Promise<AvailabilitySlot> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${buddyId}/availabilities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(slot),
    });
    if (!response.ok) {
      throw new Error('Failed to add availability');
    }
    return response.json();
  },

  addAvailabilitiesBulk: async (buddyId: string, slots: Omit<AvailabilitySlot, 'id'>[]): Promise<AvailabilitySlot[]> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${buddyId}/availabilities/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(slots),
    });
    if (!response.ok) {
      throw new Error('Failed to bulk add availabilities');
    }
    return response.json();
  },

  deleteAvailability: async (buddyId: string, slotId: string): Promise<void> => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/buddies/${buddyId}/availabilities/${slotId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete availability');
    }
  },
};
