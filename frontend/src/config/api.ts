const rawUrl = (
  import.meta.env.VITE_API_URL || "https://nifas-silk-lafto-beneficiary-and-fayda.onrender.com/api"
).trim().replace(/\/+$/, '');

// Ensure /api is appended if someone sets VITE_API_URL without /api on Vercel
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

