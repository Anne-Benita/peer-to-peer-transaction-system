import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and not already retried
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const errCode = error.response.data?.error?.code;
      
      // Only refresh if token has expired
      if (errCode === 'TOKEN_EXPIRED') {
        originalRequest._retry = true;
        
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            // No refresh token available, force logout
            window.dispatchEvent(new Event('auth-logout'));
            return Promise.reject(error);
          }
          
          // Call refresh endpoint
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          
          if (res.data && res.data.success) {
            const { access_token, refresh_token } = res.data.data;
            
            // Store new tokens
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            // Update auth header in original request and retry
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          // Refresh failed, force logout
          window.dispatchEvent(new Event('auth-logout'));
          return Promise.reject(refreshErr);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
