// API functions for Quarkus backend with JWT

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://144.126.230.234:8081/api';

// Helper to get auth headers
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

type LocalMember = {
  id: string;
  nama: string;
  noHp: string;
  status: 'active' | 'inactive';
  createdAt: string;
  name?: string;
  position?: string;
  joinDate?: string;
};

type LocalInvoice = {
  id: string;
  memberId: string;
  memberName: string;
  periode: string;
  amount: number;
  status: 'paid' | 'unpaid';
  buktiPembayaran?: string;
  createdAt: string;
  paidAt?: string;
};

type LocalNotification = {
  id: number;
  receiver: string;
  time: string; // ISO timestamp string
  status: 'Sent' | 'sent' | 'Failed' | 'failed' | 'Pending' | 'pending' | 'success';
  channel?: string;
  message?: string;
};

type PaginatedResponse<T> = {
  data: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

type NotificationStats = {
  totalNotif: number;
  notifTerkirim: number;
  notifGagal: number;
  notifPending: number;
};

// NOTIFICATION API
export const notificationAPI = {
  getAll: async (token: string, page = 0, size = 10) => {
    const url = `${API_BASE_URL}/notifications?page=${page}&size=${size}`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);
    return (await res.json()) as PaginatedResponse<LocalNotification>;
  },

  getStats: async (token: string) => {
    const url = `${API_BASE_URL}/notifications/stats`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch notification stats: ${res.status}`);
    return (await res.json()) as NotificationStats;
  },

  getLastUpdate: async (token: string) =>
    await fetch("/api/notification/last-update", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
};

// MEMBER API
export const memberAPI = {
  getAll: async (token: string) => {
    const url = `${API_BASE_URL}/members`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch members: ${res.status}`);
    return (await res.json()) as LocalMember[];
  },

  getById: async (token: string, id: string) => {
    const url = `${API_BASE_URL}/members/${id}`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch member: ${res.status}`);
    return (await res.json()) as LocalMember;
  },

  create: async (token: string, data: { nama: string; noHp: string; status: string }) => {
    const url = `${API_BASE_URL}/members`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create member: ${res.status}`);
    return (await res.json()) as LocalMember;
  },

  update: async (token: string, id: string, data: { nama: string; noHp: string; status: string }) => {
    const url = `${API_BASE_URL}/members/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to update member: ${res.status}`);
    return (await res.json()) as LocalMember;
  },

  delete: async (token: string, id: string) => {
    const url = `${API_BASE_URL}/members/${id}`;
    const res = await fetch(url, { method: 'DELETE', headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to delete member: ${res.status}`);
    return await res.json();
  },
};


// INVOICE API
export const invoiceAPI = {
  getAll: async (token: string) => {
    const url = `${API_BASE_URL}/invoices`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch invoices: ${res.status}`);
    return (await res.json()) as LocalInvoice[];
  },

  getById: async (token: string, id: string) => {
    const url = `${API_BASE_URL}/invoices/${id}`;
    const res = await fetch(url, { headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to fetch invoice: ${res.status}`);
    return (await res.json()) as LocalInvoice;
  },

  create: async (token: string, data: { memberId: string; memberName: string; periode: string; amount: number; status: string }) => {
    const url = `${API_BASE_URL}/invoices`;
    const res = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Failed to create invoice: ${res.status}`);
    return (await res.json()) as LocalInvoice;
  },

  approve: async (token: string, id: string) => {
    const url = `${API_BASE_URL}/invoices/${id}/approve`;
    const res = await fetch(url, { method: 'POST', headers: getAuthHeaders(token) });
    if (!res.ok) throw new Error(`Failed to approve invoice: ${res.status}`);
    return (await res.json()) as LocalInvoice;
  },

  uploadPaymentProof: async (token: string, id: string, file: File) => {
    const url = `${API_BASE_URL}/invoices/${id}/upload`;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form as any });
    if (!res.ok) throw new Error(`Failed to upload payment proof: ${res.status}`);
    return (await res.json()) as LocalInvoice;
  },
};

// AUTH API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  expires_in: number;
  role: string;
  token: string;
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const url = `${API_BASE_URL}/auth/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Login failed with status ${res.status}`);
    }

    return (await res.json()) as LoginResponse;
  },

  logout: async (token: string): Promise<{ message: string }> => {
    const url = `${API_BASE_URL}/auth/logout`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: "POST",
      headers,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Logout failed with status ${res.status}`);
    }

    const raw = await res.text();
    try {
      return JSON.parse(raw);
    } catch (err) {
      return { message: raw || "Logged out" };
    }
  },
};