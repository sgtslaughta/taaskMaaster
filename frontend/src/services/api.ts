/**
 * @fileoverview API Service Configuration for TaaskMaaster
 * @description Main API service setup with axios, authentication, and error handling
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * @description API configuration interface
 */
interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

/**
 * @description API error response interface
 */
export interface ApiError {
  detail: string;
  status_code: number;
  message?: string;
}

/**
 * @description API response wrapper interface
 */
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

/**
 * @description Default API configuration
 */
const defaultConfig: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * @description Create axios instance with default configuration
 */
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create(defaultConfig);

  // Request interceptor for authentication
  instance.interceptors.request.use(
    (config) => {
      // Add authentication token if available
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const response = await axios.post(
              `${defaultConfig.baseURL}/api/v1/auth/refresh`,
              { refresh_token: refreshToken }
            );

            const { access_token } = response.data;
            localStorage.setItem('access_token', access_token);

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * @description Main API instance
 */
export const api = createApiInstance();

/**
 * @description Generic API request function
 * @param config - Axios request configuration
 * @returns Promise with API response
 */
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  try {
    const response = await api(config);
    return {
      data: response.data,
      status: response.status,
    };
  } catch (error: any) {
    const apiError: ApiError = {
      detail: error.response?.data?.detail || error.message || 'Unknown error',
      status_code: error.response?.status || 500,
      message: error.response?.data?.message,
    };
    throw apiError;
  }
};

/**
 * @description GET request helper
 * @param url - API endpoint URL
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiGet = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'GET', url });
};

/**
 * @description POST request helper
 * @param url - API endpoint URL
 * @param data - Request data
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiPost = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'POST', url, data });
};

/**
 * @description PUT request helper
 * @param url - API endpoint URL
 * @param data - Request data
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiPut = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'PUT', url, data });
};

/**
 * @description DELETE request helper
 * @param url - API endpoint URL
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiDelete = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'DELETE', url });
};

/**
 * @description PATCH request helper
 * @param url - API endpoint URL
 * @param data - Request data
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiPatch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  return apiRequest<T>({ ...config, method: 'PATCH', url, data });
};

/**
 * @description Upload file helper
 * @param url - API endpoint URL
 * @param file - File to upload
 * @param config - Additional request configuration
 * @returns Promise with API response
 */
export const apiUpload = async <T = any>(
  url: string,
  file: File,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<T>({
    ...config,
    method: 'POST',
    url,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * @description Check if API is available
 * @returns Promise with health status
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiGet('/health');
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export default api;
