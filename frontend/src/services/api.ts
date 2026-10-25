import { BeneficiaryRecord, CustomFormField } from '../types/registry';
import { API_BASE_URL } from '../config/api';

export interface BeneficiaryFilterParams {
  search?: string;
  woreda?: string;
  healthStatus?: string;
  category?: string;
}

// ----------------- Beneficiaries API -----------------
export async function fetchBeneficiariesApi(filters?: BeneficiaryFilterParams): Promise<BeneficiaryRecord[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.woreda && filters.woreda !== 'ሁሉም ወረዳዎች') params.append('woreda', filters.woreda);
  if (filters?.healthStatus && filters.healthStatus !== 'ሁሉም የጤና ሁኔታዎች') params.append('healthStatus', filters.healthStatus);
  if (filters?.category && filters.category !== 'ሁሉም መደቦች') params.append('category', filters.category);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE_URL}/beneficiaries${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `የተረጂዎችን መረጃ ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function createBeneficiaryApi(record: Omit<BeneficiaryRecord, 'id'>): Promise<BeneficiaryRecord> {
  const res = await fetch(`${API_BASE_URL}/beneficiaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    headers: { 'Content-Type': 'application/json' },
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
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `መረጃውን መሰረዝ አልተቻለም (${res.statusText})`);
  }
}

// ----------------- Custom Form Fields API -----------------
export async function fetchCustomFieldsApi(): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE_URL}/custom-fields`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ተጨማሪ ቅጾችን ማምጣት አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function createCustomFieldApi(field: CustomFormField): Promise<CustomFormField> {
  const res = await fetch(`${API_BASE_URL}/custom-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ቅጹን መሰረዝ አልተቻለም (${res.statusText})`);
  }
}

export async function reorderCustomFieldsApi(fieldIds: string[]): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE_URL}/custom-fields/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fieldIds })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ቅጾቹን ማስተካከል አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

export async function resetDemoDataApi(): Promise<{ records: BeneficiaryRecord[]; customFields: CustomFormField[] }> {
  const res = await fetch(`${API_BASE_URL}/reset-demo`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `ናሙና መረጃዎችን መመለስ አልተቻለም (${res.statusText})`);
  }
  return res.json();
}

// ----------------- Authentication -----------------
const AUTH_TOKEN_KEY = 'nsl_admin_token_v1';

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
