import { create } from 'zustand';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  
  login: (userData, token) => {
    const { token: responseToken, ...user } = userData;
    const authToken = token || responseToken;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', authToken);
    set({ user, token: authToken });
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;
