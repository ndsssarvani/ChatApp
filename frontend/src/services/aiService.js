import api from './api';

export const aiService = {
  async sendMessage(data) {
    const res = await api.post('/ai/chat', data);
    return res.data;
  },

  async getConversations(search = '') {
    const res = await api.get('/ai/conversations', {
      params: search ? { search } : {},
    });
    return res.data;
  },

  async getConversation(id) {
    const res = await api.get(`/ai/conversations/${id}`);
    return res.data;
  },

  async deleteConversation(id) {
    const res = await api.delete(`/ai/conversations/${id}`);
    return res.data;
  },

  async renameConversation(id, title) {
    const res = await api.put(`/ai/conversations/${id}`, { title });
    return res.data;
  },

  async runTool(data) {
    const res = await api.post('/ai/tool', data);
    return res.data;
  },
};

export default aiService;
