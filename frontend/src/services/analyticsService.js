import api from './api';

export const analyticsService = {
  async getOverview() {
    const res = await api.get('/analytics/overview');
    return res.data;
  },

  async getDetails() {
    const res = await api.get('/analytics/details');
    return res.data;
  },
};

export default analyticsService;
