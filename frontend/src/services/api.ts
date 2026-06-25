import { mockData } from '../mock/mockData';
import { trackingService } from './tracking';

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
  selfieUrl?: string;
  verificationStatus?: 'verified' | 'pending' | 'unverified' | 'processing' | 'manual_review' | 'rejected' | 'auto_approved' | 'auto_rejected' | 'manual_approved' | 'manual_rejected';
  verificationScore?: number;
  rejectionReason?: string;
  autoVerificationMessage?: string;
  riskScore?: number;
  riskReason?: string;
  duplicateDetected?: boolean;
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
    const data = await response.json() as PageResponse<Buddy>;
    const hasSearchIntent =
      Boolean(params.searchQuery?.trim()) ||
      Boolean(params.tags?.length) ||
      (typeof params.rating === 'number' && params.rating > 0);

    if (hasSearchIntent) {
      void trackingService.track('SEARCH_BUDDY', {
        searchQuery: params.searchQuery,
        tags: params.tags,
        rating: params.rating,
        page: params.page ?? 0,
        size: params.size ?? 10,
        resultCount: Array.isArray(data.content) ? data.content.length : 0,
      });
    }
    return data;
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
  uploadAvatar: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/buddies/${id}/avatar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload buddy avatar');
    }
    return await response.json() as Buddy;
  },
  uploadIdCard: async (id: string, side: 'front' | 'back', file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/buddies/${id}/id-card/${side}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload ID card image');
    }
    return await response.json() as Buddy;
  },
  uploadSelfie: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/buddies/${id}/selfie`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload selfie video');
    }
    return await response.json() as Buddy;
  },
  getVerificationResult: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/verifications/${id}/result`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch verification result');
    }
    return response.json();
  },
  retryAutoVerification: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/verifications/${id}/retry-auto-verification`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to retry auto verification');
    }
    return response.json() as Promise<Buddy>;
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
  getLive: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/live`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text() || 'Live experience not available');
    return response.json();
  },
  create: async (bookingData: any) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) throw new Error('Failed to create booking');
    const data = await response.json();
    void trackingService.track('CREATE_BOOKING', {
      bookingId: data?.id,
      buddyId: bookingData?.buddyId ?? data?.buddy?.id,
      bookingType: bookingData?.bookingType ?? data?.bookingType,
      status: data?.status,
    });
    return data;
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
  updateItinerary: async (id: string, itineraryData: any) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/itinerary`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(itineraryData),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to update booking itinerary');
    return response.json();
  },
  cancel: async (id: string, reason?: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to cancel booking');
    return response.json();
  },
  markTravelerArrived: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/traveler-arrived`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to mark traveler arrived');
    return response.json();
  },
  markBuddyArrived: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/buddy-arrived`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to mark buddy arrived');
    return response.json();
  },
  getQrToken: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/qr-token`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to fetch QR token');
    return response.json();
  },
  startWithQr: async (id: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/start-with-qr`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ qrToken: token }),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to start trip');
    return response.json();
  },
  complete: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to complete trip');
    return response.json();
  },
};

export const reportService = {
  create: async (payload: { reportedUserId: string; reason: string; description?: string; evidenceUrl?: string }) => {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to submit report');
    return response.json();
  },
};

export const reviewService = {
  createForBooking: async (bookingId: string, payload: { rating: number; comment?: string; isPublic?: boolean }) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await response.text() || 'Failed to submit review');
    return response.json();
  },
};

export const paymentService = {
  createPayPalOrder: async (bookingId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/paypal/create-order?bookingId=${bookingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create PayPal order');
    }
    return response.json();
  },
  capturePayPalOrder: async (orderId: string, bookingId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/paypal/capture-order?orderId=${orderId}&bookingId=${bookingId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to capture PayPal order');
    }
    const data = await response.json();
    void trackingService.track('COMPLETE_PAYMENT', {
      bookingId,
      paymentId: data?.id,
      status: data?.status,
      amount: data?.amount,
    });
    return data;
  },
  getPayment: async (paymentId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payment');
    return response.json();
  },
  getBookingPayments: async (bookingId: string) => {
    const response = await fetch(`${API_BASE_URL}/payments/booking/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch booking payments');
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
  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch admin users');
    return response.json();
  },
  getVerifications: async (status?: string) => {
    const path = status ? `/admin/verifications?status=${encodeURIComponent(status)}` : '/admin/verifications';
    const response = await fetch(`${API_BASE_URL}${path}`, {
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
  updateBuddyVerification: async (buddyId: string, status: 'pending' | 'verified' | 'rejected' | 'manual_approved' | 'manual_rejected' | 'manual_review', reason?: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/buddies/${buddyId}/verification`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason }),
    });
    if (!response.ok) throw new Error('Failed to update buddy verification');
    return response.json();
  },
  updateTravelerVerification: async (travelerId: string, status: 'pending' | 'verified' | 'rejected' | 'manual_approved' | 'manual_rejected', reason?: string) => {
    const response = await fetch(`${API_BASE_URL}/admin/travelers/${travelerId}/verification`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason }),
    });
    if (!response.ok) throw new Error('Failed to update traveler verification');
    return response.json();
  },
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard/stats`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch admin dashboard stats');
    return response.json();
  },
  getAllBookings: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/bookings`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch all bookings');
    return response.json();
  },
  getAllEarningsTransactions: async () => {
    const response = await fetch(`${API_BASE_URL}/admin/earnings/transactions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch earnings transactions');
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

function normalizeEarningsTransaction(tx: any) {
  return {
    ...tx,
    amount: Number(tx.amount ?? 0),
    type: tx.type === 'payout' ? 'payout' : 'income',
  };
}

export const transactionService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch transactions');
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeEarningsTransaction) : [];
  },
  getByBuddyId: async (_buddyId: string) => {
    return transactionService.getAll();
  },
  createTransaction: async (_buddyId: string, data: any) => {
    // Delegates to payout-requests API for withdrawal requests
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create transaction');
    return response.json();
  },
};

export const payoutRequestService = {
  /** Buddy: submit a withdrawal request */
  create: async (data: {
    amount: number;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/payout-requests`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to submit withdrawal request');
    }
    return response.json();
  },

  /** Admin: get all payout requests */
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/payout-requests`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch payout requests');
    return response.json();
  },

  /** Admin: get PENDING payout requests only */
  getPending: async () => {
    const response = await fetch(`${API_BASE_URL}/payout-requests/pending`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch pending payout requests');
    return response.json();
  },

  /** Admin: approve a payout request */
  approve: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/payout-requests/${id}/approve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Failed to approve payout request');
    return response.json();
  },

  /** Admin: reject a payout request */
  reject: async (id: string, reason: string) => {
    const response = await fetch(`${API_BASE_URL}/payout-requests/${id}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject payout request');
    return response.json();
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
        description: message.description,
        date: message.date,
        time: message.startTime || message.offerTime,
        duration: message.duration,
        guests: message.guests,
        bookingType: message.bookingType,
        meetingPoint: message.meetingPoint,
        routeStops: message.routeStops,
        itineraryNotes: message.itineraryNotes,
        hours: message.hours,
        price: message.price,
      }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    const data = await response.json();
    void trackingService.track('SEND_MESSAGE', {
      conversationId: convId,
      messageId: data?.id,
      isOffer: Boolean(message?.isOffer),
      bookingType: message?.bookingType,
    });
    return data;
  },
  subscribe: (callback: () => void, onStatusChange?: (connected: boolean) => void) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return () => { };
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
  images?: string[];
  location: string;
  date: string;
  tags: string[];
  storyContent: string;
  buddyId: string;
  buddyName: string;
  bookingId?: string;
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
  uploadImage: async (id: string, file: File, displayOrder?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    const query = displayOrder === undefined ? '' : `?displayOrder=${encodeURIComponent(displayOrder)}`;
    const response = await fetch(`${API_BASE_URL}/experiences/${id}/image${query}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload experience image');
    return response.json() as Promise<Experience>;
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
