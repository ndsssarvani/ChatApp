import api from './api';

export const notificationService = {
  async getNotifications(category) {
    const params = category && category !== 'all' ? { category } : {};
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  async clearAllNotifications() {
    const res = await api.delete('/notifications');
    return res.data;
  },
};

export default notificationService;
