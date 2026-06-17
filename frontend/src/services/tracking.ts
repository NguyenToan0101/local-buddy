const API_BASE_URL = '/api';
const TRACKING_SESSION_KEY = 'local_buddy_tracking_session_key';
const SENSITIVE_KEY_PARTS = ['password', 'token', 'secret', 'authorization', 'cookie', 'credential', 'apikey', 'api_key', 'session'];
const MAX_METADATA_KEYS = 30;

export type TrackingEventType =
  | 'PAGE_VIEW'
  | 'SEARCH_BUDDY'
  | 'VIEW_BUDDY_PROFILE'
  | 'CREATE_BOOKING'
  | 'COMPLETE_PAYMENT'
  | 'LOGIN'
  | 'REGISTER'
  | 'SEND_MESSAGE'
  | 'ADD_FAVORITE';

type TrackingMetadata = Record<string, unknown>;

function getAuthHeaders(extraHeaders: Record<string, string> = {}) {
  const token = localStorage.getItem('token');
  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function createSessionKey() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (char) =>
    (Number(char) ^ (Math.floor(Math.random() * 16) >> (Number(char) / 4))).toString(16)
  );
}

function getSessionKey() {
  let sessionKey = localStorage.getItem(TRACKING_SESSION_KEY);
  if (!sessionKey) {
    sessionKey = createSessionKey();
    localStorage.setItem(TRACKING_SESSION_KEY, sessionKey);
  }
  return sessionKey;
}

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function sanitizeMetadata(metadata?: TrackingMetadata): TrackingMetadata {
  if (!metadata) return {};
  const safe: TrackingMetadata = {};

  Object.entries(metadata).slice(0, MAX_METADATA_KEYS).forEach(([key, value]) => {
    if (!key || isSensitiveKey(key)) return;
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      safe[key] = value.slice(0, 500);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
      return;
    }
    if (Array.isArray(value)) {
      safe[key] = value.slice(0, 20).map((item) => {
        if (typeof item === 'string') return item.slice(0, 200);
        if (typeof item === 'number' || typeof item === 'boolean') return item;
        return String(item).slice(0, 200);
      });
      return;
    }

    safe[key] = String(value).slice(0, 500);
  });

  return safe;
}

function getCurrentPageUrl() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

function isAdminUser() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return false;
    const user = JSON.parse(rawUser);
    return user?.role === 'ADMIN';
  } catch {
    return false;
  }
}

function shouldSkipTracking(pageUrl: string) {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0';
  return isLocalhost || pageUrl.startsWith('/admin') || isAdminUser();
}

export const trackingService = {
  track: async (eventType: TrackingEventType, metadata: TrackingMetadata = {}, pageUrl?: string) => {
    try {
      const resolvedPageUrl = pageUrl || getCurrentPageUrl();
      if (shouldSkipTracking(resolvedPageUrl)) return;

      await fetch(`${API_BASE_URL}/tracking/event`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          sessionKey: getSessionKey(),
          eventType,
          pageUrl: resolvedPageUrl,
          metadata: sanitizeMetadata(metadata),
        }),
      });
    } catch {
      // Tracking must never break the product flow.
    }
  },
};
