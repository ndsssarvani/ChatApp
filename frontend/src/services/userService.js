import api from './api';

export const userService = {
  async getUsers(search = '') {
    const res = await api.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    return res.data;
  },

  async getUserById(id) {
    const res = await api.get(`/users/profile/${id}`);
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/users/profile', data);
    return res.data;
  },

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async removeAvatar() {
    const res = await api.delete('/users/avatar');
    return res.data;
  },

  async updatePreferences(preferences) {
    const res = await api.put('/users/preferences', preferences);
    return res.data;
  },

  async changePassword(data) {
    const res = await api.put('/users/change-password', data);
    return res.data;
  },

  async getContacts() {
    const res = await api.get('/users/contacts');
    return res.data;
  },

  async addContact(id) {
    const res = await api.post(`/users/contacts/${id}`);
    return res.data;
  },

  async removeContact(id) {
    const res = await api.delete(`/users/contacts/${id}`);
    return res.data;
  },

  async blockUser(id) {
    const res = await api.post(`/users/block/${id}`);
    return res.data;
  },

  async unblockUser(id) {
    const res = await api.post(`/users/unblock/${id}`);
    return res.data;
  },

  async getBlockedUsers() {
    const res = await api.get('/users/blocked');
    return res.data;
  },

  async reportUser(data) {
    const res = await api.post('/users/report', data);
    return res.data;
  },

  async getSessions() {
    const res = await api.get('/users/sessions');
    return res.data;
  },

  async logoutOtherSessions() {
    const res = await api.post('/users/sessions/logout-other');
    return res.data;
  },

  async deleteAccount() {
    const res = await api.delete('/users/account');
    return res.data;
  },
};

export default userService;
