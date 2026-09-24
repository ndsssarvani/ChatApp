import api from './api';

export const callService = {
  getCalls: async () => {
    const response = await api.get('/calls');
    return response.data;
  },

  logCall: async (callData) => {
    const response = await api.post('/calls', callData);
    return response.data;
  },

  deleteCall: async (id) => {
    const response = await api.delete(`/calls/${id}`);
    return response.data;
  },

  clearCallHistory: async () => {
    const response = await api.delete('/calls');
    return response.data;
  },
};

export default callService;
