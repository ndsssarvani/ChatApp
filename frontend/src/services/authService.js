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

  async validateResetToken(token) {
    const res = await api.get(`/auth/reset-password/validate/${encodeURIComponent(token)}`);
    return res.data;
  },

  async resetPassword(data) {
    const res = await api.post('/auth/reset-password', data);
    return res.data;
  },

  async sendOTP(email, purpose = 'login') {
    const res = await api.post('/auth/send-otp', { email, purpose });
    return res.data;
  },

  async verifyOTP(email, otp, purpose = 'login') {
    const res = await api.post('/auth/verify-otp', { email, otp, purpose });
    return res.data;
  },
};

export default authService;
