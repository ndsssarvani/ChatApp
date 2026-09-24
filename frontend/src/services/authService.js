import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    return res.data;
  },

  async googleAuth(payload) {
    const res = await api.post('/auth/google', payload);
    return res.data;
  },

  async getGoogleAccounts() {
    const res = await api.get('/auth/google-accounts');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },
};

export default authService;
