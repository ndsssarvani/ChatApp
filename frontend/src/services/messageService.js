import api from './api';

export const messageService = {
  async getMessages(conversationId) {
    const res = await api.get(`/messages/${conversationId}`);
    return res.data;
  },

  async sendMessage(data) {
    const res = await api.post('/messages', data);
    return res.data;
  },

  async uploadAttachment(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async editMessage(id, text) {
    const res = await api.put(`/messages/${id}`, { text });
    return res.data;
  },

  async deleteMessage(id, deleteType = 'me') {
    const res = await api.delete(`/messages/${id}?deleteType=${deleteType}`);
    return res.data;
  },

  async toggleStar(id) {
    const res = await api.post(`/messages/${id}/star`);
    return res.data;
  },

  async getStarred() {
    const res = await api.get('/messages/starred');
    return res.data;
  },

  async addReaction(id, emoji) {
    const res = await api.post(`/messages/${id}/react`, { emoji });
    return res.data;
  },

  async searchMessages(query, conversationId = '') {
    const url = `/messages/search?query=${encodeURIComponent(query)}${
      conversationId ? `&conversationId=${conversationId}` : ''
    }`;
    const res = await api.get(url);
    return res.data;
  },
};

export default messageService;
