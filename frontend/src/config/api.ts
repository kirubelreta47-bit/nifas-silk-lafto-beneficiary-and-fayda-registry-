const configured = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const rawUrl = configured || (
  import.meta.env.DEV
    ? '/api'
    : 'https://nifas-silk-lafto-beneficiary-and-fayda.onrender.com/api'
);

// Ensure /api is appended if someone sets VITE_API_URL without /api on Vercel
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

