import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadForm16 = async (file, age) => {
  const formData = new FormData();
  formData.append('form16', file);
  formData.append('age', age);

  const response = await api.post('/tax/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const calculateTax = async (taxData, age) => {
  const response = await api.post('/tax/calculate', { taxData, age });
  return response.data;
};

export const getTaxSlabs = async () => {
  const response = await api.get('/tax/slabs');
  return response.data;
};

export const getDeductionsInfo = async () => {
  const response = await api.get('/tax/deductions');
  return response.data;
};

export default api;

// Made with Bob
