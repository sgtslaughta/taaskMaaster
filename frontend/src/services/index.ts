/**
 * @fileoverview Services exports for TaaskMaaster
 * @description Central export point for all API services
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

// API configuration and utilities
export * from './api';

// Authentication service
export * from './authService';

// Task management service
export * from './taskService';

// Re-export service instances for convenience
export { authService } from './authService';
export { taskService } from './taskService';
