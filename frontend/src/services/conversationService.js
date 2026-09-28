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
    // Accepts array of user IDs
    const userIds = Array.isArray(members) ? members : [members];
    const res = await api.post(`/conversations/${id}/members`, { userIds, members: userIds });
    return res.data;
  },

  async addGroupMembers(id, userIds) {
    const ids = Array.isArray(userIds) ? userIds : [userIds];
    const res = await api.post(`/conversations/${id}/members`, { userIds: ids, members: ids });
    return res.data;
  },

  async removeMember(id, userId) {
    const res = await api.delete(`/conversations/${id}/members/${userId}`);
    return res.data;
  },

  async getGroupInvite(id) {
    const res = await api.get(`/conversations/${id}/invite`);
    return res.data;
  },

  async generateGroupInvite(id) {
    const res = await api.get(`/conversations/${id}/invite`);
    return res.data;
  },

  async regenerateGroupInvite(id) {
    const res = await api.post(`/conversations/${id}/invite/regenerate`);
    return res.data;
  },

  async toggleGroupInviteStatus(id, enabled) {
    const res = await api.put(`/conversations/${id}/invite/status`, { enabled });
    return res.data;
  },

  async getInviteInfo(token) {
    const res = await api.get(`/conversations/invite/${token}`);
    return res.data;
  },

  async joinGroupByInvite(token) {
    const res = await api.post(`/conversations/invite/${token}/join`);
    return res.data;
  },

  async setTemporaryTimer(id, isTemporary, timerHours) {
    const res = await api.put(`/conversations/${id}/temporary`, { isTemporary, timerHours });
    return res.data;
  },

  async deleteConversation(id) {
    const res = await api.delete(`/conversations/${id}`);
    return res.data;
  },
};

export default conversationService;
