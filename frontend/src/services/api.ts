import { mockData } from '../mock/mockData';

type Db = Record<string, any>;
const DB_KEY = 'mock_db_v1';

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

export const buddyService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'buddies')) as Buddy[];
  },
  getById: async (id: string) => {
    const db = loadDb();
    const buddies = ensureArray(db, 'buddies');
    const found = getById<Buddy>(buddies, id);
    if (!found) throw new Error('Buddy not found');
    return clone(found) as Buddy;
  },
  updateProfile: async (id: string, data: Partial<Buddy>) => {
    const db = loadDb();
    const buddies = ensureArray(db, 'buddies');
    const updated = patchById<Buddy>(buddies, id, data);
    if (!updated) throw new Error('Buddy not found');
    saveDb(db);
    return clone(updated) as Buddy;
  },
};

export const bookingService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'bookings'));
  },
  getById: async (id: string) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    const found = getById<any>(bookings, id);
    if (!found) throw new Error('Booking not found');
    return clone(found);
  },
  create: async (bookingData: any) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    const created = { ...bookingData, id: bookingData.id || String(Date.now()) };
    bookings.push(created);
    saveDb(db);
    return clone(created);
  },
  getByUserId: async (userId: string) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    return clone(bookings.filter((b: any) => String(b.userId) === String(userId)));
  },
  getByBuddyId: async (buddyId: string) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    return clone(bookings.filter((b: any) => String(b.buddyId) === String(buddyId)));
  },
  updateStatus: async (id: string, status: string) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    const updated = patchById<any>(bookings, id, { status });
    if (!updated) throw new Error('Booking not found');
    saveDb(db);
    return clone(updated);
  },
  updateMeetupStatus: async (id: string, status: string | null) => {
    const db = loadDb();
    const bookings = ensureArray(db, 'bookings');
    const updated = patchById<any>(bookings, id, { meetupStatus: status });
    if (!updated) throw new Error('Booking not found');
    saveDb(db);
    return clone(updated);
  },
};

export const userService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'users'));
  },
  getById: async (id: string) => {
    const db = loadDb();
    const users = ensureArray(db, 'users');
    const found = getById<any>(users, id);
    if (!found) throw new Error('User not found');
    return clone(found);
  },
  patchById: async (id: string, patch: any) => {
    const db = loadDb();
    const users = ensureArray(db, 'users');
    const updated = patchById<any>(users, id, patch);
    if (!updated) throw new Error('User not found');
    saveDb(db);
    return clone(updated);
  },
};

export const matchService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'matches'));
  },
};

export const earningService = {
  getStats: async () => {
    const db = loadDb();
    return clone(db.earnings || { transactions: [] });
  },
  setTransactions: async (transactions: any[]) => {
    const db = loadDb();
    db.earnings = { ...(db.earnings || {}), transactions };
    saveDb(db);
    return clone(db.earnings);
  },
  appendTransaction: async (tx: any) => {
    const db = loadDb();
    const current = (db.earnings?.transactions || []) as any[];
    const next = [...current, tx];
    db.earnings = { ...(db.earnings || {}), transactions: next };
    saveDb(db);
    return clone(db.earnings);
  },
};

export const transactionService = {
  getAll: async () => {
    const db = loadDb();
    return clone((db.earnings?.transactions || []) as any[]);
  },
  getByBuddyId: async (buddyId: string) => {
    const db = loadDb();
    const tx = (db.earnings?.transactions || []) as any[];
    return clone(tx.filter((t: any) => String(t.buddyId) === String(buddyId)));
  },
};

export const messageService = {
  getConversations: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'conversations'));
  },
  getMessagesByConvId: async (convId: string) => {
    const db = loadDb();
    const conv = getById<any>(ensureArray(db, 'conversations'), convId);
    if (!conv) throw new Error('Conversation not found');
    return clone(conv.messages || []);
  },
  sendMessage: async (convId: string, message: any) => {
    const db = loadDb();
    const convs = ensureArray(db, 'conversations');
    const conv = getById<any>(convs, convId);
    if (!conv) throw new Error('Conversation not found');
    const updatedMessages = [...(conv.messages || []), { ...message, id: Date.now() }];
    const updated = patchById<any>(convs, convId, {
      messages: updatedMessages,
      lastMsg: message.text || message.content,
      time: 'Just now',
    });
    saveDb(db);
    return clone(updated);
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
    const db = loadDb();
    return clone(ensureArray(db, 'experiences')) as Experience[];
  },
  getById: async (id: string) => {
    const db = loadDb();
    const exp = getById<Experience>(ensureArray(db, 'experiences'), id);
    if (!exp) throw new Error('Experience not found');
    return clone(exp) as Experience;
  },
  getByBuddyId: async (buddyId: string) => {
    const db = loadDb();
    const exps = ensureArray(db, 'experiences');
    return clone(exps.filter((e: any) => String(e.buddyId) === String(buddyId))) as Experience[];
  },
  update: async (id: string, data: Partial<Experience>) => {
    const db = loadDb();
    const exps = ensureArray(db, 'experiences');
    const updated = patchById<Experience>(exps, id, data);
    if (!updated) throw new Error('Experience not found');
    saveDb(db);
    return clone(updated) as Experience;
  },
  create: async (data: Omit<Experience, 'id'>) => {
    const db = loadDb();
    const exps = ensureArray(db, 'experiences');
    const created = { ...data, id: Date.now().toString() };
    exps.push(created);
    saveDb(db);
    return clone(created) as Experience;
  },
};

export const notificationService = {
  getAll: async () => {
    const db = loadDb();
    return clone(ensureArray(db, 'notifications'));
  },
  markAsRead: async (id: string) => {
    const db = loadDb();
    const notifs = ensureArray(db, 'notifications');
    const updated = patchById<any>(notifs, id, { unread: false });
    if (!updated) throw new Error('Notification not found');
    saveDb(db);
    return clone(updated);
  },
};
