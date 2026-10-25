import { BeneficiaryRecord, CustomFormField } from '../types/registry';

// Configurable API URL with fallback
const RAW_API_URL = import.meta.env.VITE_API_URL || '/api';
export const API_BASE = RAW_API_URL.replace(/\/+$/, '');

export interface BeneficiaryFilterParams {
  search?: string;
  woreda?: string;
  healthStatus?: string;
  category?: string;
}

export async function fetchBeneficiariesApi(filters?: BeneficiaryFilterParams): Promise<BeneficiaryRecord[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.woreda && filters.woreda !== 'ሁሉም ወረዳዎች') params.append('woreda', filters.woreda);
  if (filters?.healthStatus && filters.healthStatus !== 'ሁሉም የጤና ሁኔታዎች') params.append('healthStatus', filters.healthStatus);
  if (filters?.category && filters.category !== 'ሁሉም መደቦች') params.append('category', filters.category);

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/beneficiaries${qs}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch beneficiaries: ${res.statusText}`);
  }
  return res.json();
}

export async function createBeneficiaryApi(record: Omit<BeneficiaryRecord, 'id'>): Promise<BeneficiaryRecord> {
  const res = await fetch(`${API_BASE}/beneficiaries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create beneficiary: ${res.statusText}`);
  }
  return res.json();
}

export async function updateBeneficiaryApi(record: BeneficiaryRecord): Promise<BeneficiaryRecord> {
  const res = await fetch(`${API_BASE}/beneficiaries/${record.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to update beneficiary: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteBeneficiaryApi(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/beneficiaries/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Failed to delete beneficiary: ${res.statusText}`);
  }
}

export async function fetchCustomFieldsApi(): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE}/custom-fields`);
  if (!res.ok) {
    throw new Error(`Failed to fetch custom fields: ${res.statusText}`);
  }
  return res.json();
}

export async function createCustomFieldApi(field: CustomFormField): Promise<CustomFormField> {
  const res = await fetch(`${API_BASE}/custom-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(field)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create custom field: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteCustomFieldApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/custom-fields/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Failed to delete custom field: ${res.statusText}`);
  }
}

export async function reorderCustomFieldsApi(fieldIds: string[]): Promise<CustomFormField[]> {
  const res = await fetch(`${API_BASE}/custom-fields/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fieldIds })
  });
  if (!res.ok) {
    throw new Error(`Failed to reorder custom fields: ${res.statusText}`);
  }
  return res.json();
}

export async function resetDemoDataApi(): Promise<{ records: BeneficiaryRecord[]; customFields: CustomFormField[] }> {
  const res = await fetch(`${API_BASE}/reset-demo`, {
    method: 'POST'
  });
  if (!res.ok) {
    throw new Error(`Failed to reset demo data: ${res.statusText}`);
  }
  return res.json();
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok';
    }
  } catch {
    // Backend offline / not reachable
  }
  return false;
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
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `መግባት አልተቻለም (${res.statusText})`);
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
    const res = await fetch(`${API_BASE}/auth/me`, {
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
  clearStoredAuthToken();
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch {
    // ignore network errors on logout
  }
}
