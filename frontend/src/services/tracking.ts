const SENSITIVE_KEY_PARTS = ['password', 'token', 'secret', 'authorization', 'cookie', 'credential', 'apikey', 'api_key', 'session', 'user_id'];
const MAX_METADATA_KEYS = 25;
const GA4_MEASUREMENT_ID = 'G-9L0TFC23QJ';

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

const EVENT_NAME_BY_TYPE: Record<TrackingEventType, string> = {
  PAGE_VIEW: 'page_view',
  SEARCH_BUDDY: 'search',
  VIEW_BUDDY_PROFILE: 'view_buddy_profile',
  CREATE_BOOKING: 'create_booking',
  COMPLETE_PAYMENT: 'purchase',
  LOGIN: 'login',
  REGISTER: 'sign_up',
  SEND_MESSAGE: 'send_message',
  ADD_FAVORITE: 'add_to_wishlist',
};

let gaInitialized = false;

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

function toGa4ParamName(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 40);
}

function sanitizeMetadata(metadata?: TrackingMetadata): TrackingMetadata {
  if (!metadata) return {};
  const safe: TrackingMetadata = {};

  Object.entries(metadata).slice(0, MAX_METADATA_KEYS).forEach(([key, value]) => {
    const gaKey = toGa4ParamName(key);
    if (!gaKey || isSensitiveKey(gaKey)) return;
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      safe[gaKey] = value.slice(0, 100);
      return;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      safe[gaKey] = value;
      return;
    }
    if (Array.isArray(value)) {
      safe[gaKey] = value
        .slice(0, 10)
        .map((item) => (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' ? item : String(item).slice(0, 100)))
        .join(',');
      return;
    }

    safe[gaKey] = String(value).slice(0, 100);
  });

  return safe;
}

function getCurrentPageUrl() {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}`;
}

function shouldSkipTracking(pageUrl: string) {
  return pageUrl.startsWith('/admin');
}

function ensureGa4Loaded() {
  if (gaInitialized || typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer?.push(arguments);
  };

  const scriptId = 'ga4-gtag';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID, {
    send_page_view: false,
  });
  gaInitialized = true;
}

function buildCommonParams(pageUrl: string) {
  return {
    page_path: pageUrl,
    page_location: `${window.location.origin}${pageUrl}`,
    page_title: document.title,
  };
}

function buildEventParams(eventType: TrackingEventType, metadata: TrackingMetadata, pageUrl: string) {
  const safeMetadata = sanitizeMetadata(metadata);
  const commonParams = {
    ...buildCommonParams(pageUrl),
    ...safeMetadata,
    page_title: typeof safeMetadata.page_title === 'string' ? safeMetadata.page_title : document.title,
  };

  if (eventType === 'SEARCH_BUDDY') {
    return {
      ...commonParams,
      search_term: typeof safeMetadata.search_query === 'string' ? safeMetadata.search_query : undefined,
    };
  }

  if (eventType === 'COMPLETE_PAYMENT') {
    return {
      ...commonParams,
      transaction_id: typeof safeMetadata.payment_id === 'string' ? safeMetadata.payment_id : safeMetadata.booking_id,
      value: typeof safeMetadata.amount === 'number' ? safeMetadata.amount : undefined,
      currency: 'USD',
    };
  }

  return commonParams;
}

export const trackingService = {
  track: async (eventType: TrackingEventType, metadata: TrackingMetadata = {}, pageUrl?: string) => {
    try {
      const resolvedPageUrl = pageUrl || getCurrentPageUrl();
      if (shouldSkipTracking(resolvedPageUrl)) return;

      ensureGa4Loaded();
      window.gtag?.('event', EVENT_NAME_BY_TYPE[eventType], buildEventParams(eventType, metadata, resolvedPageUrl));
    } catch {
      // Analytics must never break the product flow.
    }
  },
  heartbeat: async () => {
    // GA4 handles engagement collection client-side; the legacy heartbeat endpoint is no longer used.
  },
};
