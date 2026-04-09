let apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl && !apiUrl.startsWith('http')) {
  apiUrl = `https://${apiUrl}`;
}
export const API_BASE_URL = apiUrl || 'http://localhost:5000';
