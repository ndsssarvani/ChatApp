import api from './api';

export const supportService = {
  async getFaqs() {
    const res = await api.get('/support/faqs');
    return res.data;
  },

  async createTicket(data) {
    const res = await api.post('/support/tickets', data);
    return res.data;
  },
};

export default supportService;
