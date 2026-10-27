import { BeneficiaryRecord, CustomFormField, RegistryStats } from '../types/registry';
import { API_BASE_URL } from '../config/api';

export interface BeneficiaryFilterParams {
  search?: string;
  woreda?: string;
  healthStatus?: string;
  category?: string;
  page?: number;
  limit?: number;
  exportAll?: boolean;
}

export interface BeneficiaryPage {
  records: BeneficiaryRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RegistryStatsResponse extends RegistryStats {
  nextId: number;
}

// ----------------- Beneficiaries API -----------------
export async function fetchBeneficiariesApi(filters?: BeneficiaryFilterParams): Promise<BeneficiaryPage> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.woreda && filters.woreda !== 'ሁሉም ወረዳዎች' && filters.woreda !== 'all') params.append('woreda', filters.woreda);
  if (filters?.healthStatus && filters.healthStatus !== 'ሁሉም የጤና ሁኔታዎች' && filters.healthStatus !== 'all') {
    params.append('healthStatus', filters.healthStatus);
  }
  if (filters?.category && filters.category !== 'ሁሉም መደቦች' && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  if (filters?.exportAll) {
    params.append('export', '1');
  } else {
    params.append('page', String(filters?.page || 1));
    params.append('limit', String(filters?.limit || 40));
  }

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/beneficiaries${qs}`, { headers: withAuth() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `የተረጂዎችን መረጃ ማምጣት አልተቻለም (${res.statusText})`);
  }
  const data = await res.json();
  if (Array.isArray(data)) {
    return { records: data, total: data.length, page: 1, pageSize: data.length };
  }
  return data;
}

export interface ReportSlice {
  groupBy: string;
  splitBy: string;
  metric: string;
  truncated: boolean;
  series: string[];
  rows: {
    label: string;
    people: number;
    total: number;
    parts: { key: string; value: number }[];
  }[];
}

export async function fetchReportSliceApi(options: {
  groupBy: string;
  splitBy: string;
  metric: string;
  top: number;
}): Promise<ReportSlice> {
  const params = new URLSearchParams({
    groupBy: options.groupBy,
    splitBy: options.splitBy,
    metric: options.metric,
    top: String(options.top)
  });
  const res = await fetch(`${API_BASE_URL}/beneficiaries/report?${params.toString()}`, { headers: withAuth() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ሪፖርቱን ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function fetchRegistryStatsApi(): Promise<RegistryStatsResponse> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries/stats`, { headers: withAuth() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ስታትስቲክስ ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export interface BeneficiaryImportResult {
  created: BeneficiaryRecord[];
  skipped: { row?: number; faydaId?: string; reason: string }[];
  rejected: { row?: number; faydaId?: string; reason: string }[];
}

export async function importBeneficiariesApi(
  records: Array<Omit<BeneficiaryRecord, 'id'> & { sourceRow?: number }>
): Promise<BeneficiaryImportResult> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries/import`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ records })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ከ Excel ማስገባት አልተሳካም (${res.statusText})`);
  }
  return res.json();
}

export async function createBeneficiaryApi(record: Omit<BeneficiaryRecord, 'id'>): Promise<BeneficiaryRecord> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ምዝገባው አልተሳካም (${res.statusText})`);
  }
  return res.json();
}

export async function updateBeneficiaryApi(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries/${record.id}`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `መረጃውን ማደስ አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function deleteBeneficiaryApi(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries/${id}`, {
    method: 'DELETE',
    headers: withAuth()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `መረጃውን መሰረዝ አልተቻለም (${res.statusText})`);
  }
}

// ----------------- Custom Form Fields API -----------------
export async function fetchCustomFieldsApi(): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE_URL}/custom-fields`, { headers: withAuth() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ተጨማሪ ቅጾችን ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function createCustomFieldApi(field: CustomFormField): Promise<CustomFormField> {
  const res = await fetch(`${API_BASE_URL}/custom-fields`, {
    method: 'POST',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(field)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `አዲስ ቅጽ ማስመዝገብ አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function deleteCustomFieldApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/custom-fields/${id}`, {
    method: 'DELETE',
    headers: withAuth()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ቅጹን መሰረዝ አልተቻለም (${res.statusText})`);
  }
}

export async function reorderCustomFieldsApi(fieldIds: string[]): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE_URL}/custom-fields/reorder`, {
    method: 'PUT',
    headers: withAuth({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ fieldIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ቅጾቹን ማስተካከል አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

// ----------------- Authentication -----------------
const AUTH_TOKEN_KEY = 'nsl_admin_token_v1';

function withAuth(headers: Record<string, string> = {}): Record<string, string> {
  const token = getStoredAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export function getStoredAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to store auth token', e);
  }
}

export function clearStoredAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to clear auth token', e);
  }
}

export async function loginAdminApi(usernameOrEmail: string, password: string): Promise<{ token: string; user: any }> {
  // Support both /auth/login and /login
  let res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password })
  });

  if (res.status === 404) {
    res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `የተሳሳተ የተጠቃሚ ስም ወይም የይለፍ ቃል ነው (${res.statusText})`);
  }

  const data = await res.json();
  if (data.token) {
    setStoredAuthToken(data.token);
  }
  return data;
}

export async function getCurrentAdminApi(): Promise<any | null> {
  const token = getStoredAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      clearStoredAuthToken();
      return null;
    }

    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function logoutAdminApi(): Promise<void> {
  const token = getStoredAuthToken();
  clearStoredAuthToken();
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch {
      // Ignore network errors on logout
    }
  }
}

// ----------------- User Management API -----------------
export async function fetchUsersApi(): Promise<AdminUser[]> {
  const token = getStoredAuthToken();
  const res = await fetch(`${API_BASE_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ተጠቃሚዎችን ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function createUserApi(userData: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  woreda?: string;
}): Promise<AdminUser> {
  const token = getStoredAuthToken();
  const res = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `አዲስ ተጠቃሚ መመዝገብ አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function deleteUserApi(id: number): Promise<void> {
  const token = getStoredAuthToken();
  const res = await fetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ተጠቃሚውን መሰረዝ አልተቻለም (${res.statusText})`);
  }
}

