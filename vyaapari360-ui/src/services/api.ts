import axios from 'axios';
import {
  Voucher,
  VoucherDetails,
  Ledger,
  LedgerDetails,
  Group,
  VoucherType,
  DashboardStats,
  PaginationInfo
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Voucher API calls
export const voucherApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await api.get('/vouchers', { params });
    return response.data;
  },

  getById: async (guid: string) => {
    const response = await api.get(`/vouchers/${guid}`);
    return response.data;
  },
};

// Ledger API calls
export const ledgerApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    group?: string;
  }) => {
    const response = await api.get('/ledgers', { params });
    return response.data;
  },

  getByName: async (name: string, params?: {
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await api.get(`/ledgers/${encodeURIComponent(name)}`, { params });
    return response.data;
  },
};

// Master data API calls
export const masterApi = {
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getVoucherTypes: async () => {
    const response = await api.get('/voucher-types');
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default api;

