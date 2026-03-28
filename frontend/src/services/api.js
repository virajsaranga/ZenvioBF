import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ===== Auth =====
export const authAPI = {
  register:       (data)  => api.post('/auth/register', data),
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  getMe:          ()      => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail:    (token) => api.get(`/auth/verify-email/${token}`),
};

// ===== User =====
export const userAPI = {
  getProfile:     ()     => api.get('/users/profile'),
  updateProfile:  (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  uploadAvatar:   (form) => api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  lookup:         (acc)  => api.get(`/users/lookup/${acc}`),
  getReferrals:   ()     => api.get('/users/referrals'),
};

// ===== Transactions =====
export const transactionAPI = {
  transfer:        (data)   => api.post('/transactions/transfer', data),
  getAll:          (params) => api.get('/transactions', { params }),
  getOne:          (id)     => api.get(`/transactions/${id}`),
  getSummary:      ()       => api.get('/transactions/summary'),
};

// ===== Deposits =====
export const depositAPI = {
  request: (form) => api.post('/deposits/request', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll:  (params) => api.get('/deposits', { params }),
};

// ===== Withdrawals =====
export const withdrawalAPI = {
  request: (data) => api.post('/withdrawals/request', data),
  getAll:  (params) => api.get('/withdrawals', { params }),
  cancel:  (id)   => api.delete(`/withdrawals/${id}/cancel`),
};

// ===== KYC =====
export const kycAPI = {
  submit:    (form) => api.post('/kyc/submit', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStatus: ()     => api.get('/kyc/status'),
};

// ===== Trust Points =====
export const trustAPI = {
  getPoints: ()       => api.get('/trust-points'),
  redeem:    (points) => api.post('/trust-points/redeem', { points }),
};

// ===== Notifications =====
export const notificationAPI = {
  getAll:     (params) => api.get('/notifications', { params }),
  markRead:   (id)     => api.put(`/notifications/${id}/read`),
  markAllRead:()       => api.put('/notifications/read-all'),
  delete:     (id)     => api.delete(`/notifications/${id}`),
};

// ===== Partner =====
export const partnerAPI = {
  getStats: () => api.get('/partner/stats'),
  apply:    () => api.post('/partner/apply'),
};

// ===== Admin =====
export const adminAPI = {
  getDashboard:      ()       => api.get('/admin/dashboard'),
  getUsers:          (params) => api.get('/admin/users', { params }),
  updateUserStatus:  (id, data) => api.put(`/admin/users/${id}/status`, data),
  reviewKYC:         (userId, data) => api.put(`/admin/kyc/${userId}/review`, data),
  getAllTransactions: (params) => api.get('/admin/transactions', { params }),
  reviewDeposit:     (id, data) => api.put(`/admin/deposits/${id}/review`, data),
  processWithdrawal: (id, data) => api.put(`/admin/withdrawals/${id}/process`, data),
};

export default api;
