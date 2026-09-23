import api from './api';

export const conversationService = {
  async getConversations() {
    const res = await api.get('/conversations');
    return res.data;
  },

  async getOrCreateOneToOne(recipientId) {
    const res = await api.post('/conversations/one-to-one', { recipientId });
    return res.data;
  },

  async createGroup(data) {
    const res = await api.post('/conversations/group', data);
    return res.data;
  },

  async updateGroup(id, data) {
    const res = await api.put(`/conversations/${id}/group`, data);
    return res.data;
  },

  async addMembers(id, members) {
    const res = await api.post(`/conversations/${id}/members`, { members });
    return res.data;
  },

  async removeMember(id, userId) {
    const res = await api.delete(`/conversations/${id}/members/${userId}`);
    return res.data;
  },

  async setTemporaryTimer(id, isTemporary, timerHours) {
    const res = await api.put(`/conversations/${id}/temporary`, { isTemporary, timerHours });
    return res.data;
  },
};

export default conversationService;
