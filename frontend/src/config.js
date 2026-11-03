const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiUrl = configuredApiUrl
  ? (/^https?:\/\//i.test(configuredApiUrl) ? configuredApiUrl : `https://${configuredApiUrl}`)
  : import.meta.env.PROD
    ? 'https://online-auction-sytem-mvb2.vercel.app'
    : 'http://localhost:5000';

export const API_BASE_URL = apiUrl.replace(/\/+$/, '');
