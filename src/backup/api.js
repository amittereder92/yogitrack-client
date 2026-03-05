import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

export const instructorsAPI = {
  getAll: () => API.get('/api/instructors'),
  create: (data) => API.post('/api/instructors', data),
  update: (id, data) => API.put(`/api/instructors/${id}`, data),
};

export const customersAPI = {
  getAll: () => API.get('/api/customers'),
  create: (data) => API.post('/api/customers', data),
  update: (id, data) => API.put(`/api/customers/${id}`, data),
};

export const classesAPI = {
  getAll: () => API.get('/api/classes'),
  create: (data) => API.post('/api/classes', data),
  update: (id, data) => API.put(`/api/classes/${id}`, data),
};

export const packagesAPI = {
  getAll: () => API.get('/api/packages'),
  create: (data) => API.post('/api/packages', data),
};

export const salesAPI = {
  getAll: (params) => API.get('/api/sales', { params }),
  create: (data) => API.post('/api/sales', data),
};

export const attendanceAPI = {
  getAll: (params) => API.get('/api/attendances', { params }),
  create: (data) => API.post('/api/attendances', data),
  getClassesByInstructor: (instructorId) => API.get(`/api/attendances/classes/${instructorId}`),
};

export default API;
