/**
 * @fileoverview Login page component for TaaskMaaster
 * @description A modern login page with animations, form validation, and social login integration
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, CardFooter } from '../../../design-system';
import { Button } from '../../../design-system';
import { Input } from '../../../design-system';
import { cn } from '../../../design-system/utils/cn';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * @description Login form data interface
 */
export interface LoginFormData {
  /**
   * @description User email or username
   */
  email: string;
  /**
   * @description User password
   */
  password: string;
  /**
   * @description Whether to remember the user
   */
  rememberMe: boolean;
}

/**
 * @description Login page props interface
 */
export interface LoginPageProps {
  /**
   * @description Function to handle login form submission
   */
  onSubmit?: (data: LoginFormData) => void;
  /**
   * @description Whether the form is loading
   */
  loading?: boolean;
  /**
   * @description Error message to display
   */
  error?: string;
  /**
   * @description Function to handle social login
   */
  onSocialLogin?: (provider: string) => void;
  /**
   * @description Function to navigate to registration page
   */
  onRegisterClick?: () => void;
  /**
   * @description Function to navigate to password reset page
   */
  onForgotPasswordClick?: () => void;
  /**
   * @description Additional CSS classes
   */
  className?: string;
}

/**
 * @description Login page component
 * @param props - Login page props
 * @returns Login page component
 */
export const LoginPage: React.FC<LoginPageProps> = ({
  onSubmit,
  loading: externalLoading = false,
  error: externalError,
  onSocialLogin,
  onRegisterClick,
  onForgotPasswordClick,
  className,
}) => {
  const { login, isLoading: authLoading, error: authError, clearError } = useAuth();
  const loading = externalLoading || authLoading;
  const error = externalError || authError;
  const [formData, setFormData] = useState<LoginFormData>({
    email: 'admin',
    password: 'admin123',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Partial<LoginFormData>>({});

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<LoginFormData> = {};

    if (!formData.email.trim()) {
      errors.email = 'Username or email is required';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        clearError();
        await login({
          username: formData.email,
          password: formData.password,
        });
        
        // Call external onSubmit if provided
        if (onSubmit) {
          onSubmit(formData);
        }
      } catch (error) {
        // Error is handled by the auth context
        console.error('Login failed:', error);
      }
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    }
  };

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4', className)}>
      <div className="w-full max-w-md">
        
        {/* Logo and welcome */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to your TaaskMaaster account
          </p>
        </div>

        {/* Login card */}
        <Card className="shadow-xl">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username/Email input */}
              <Input
                label="Username or Email"
                type="text"
                placeholder="Enter your username or email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={validationErrors.email}
                required
                autoComplete="username"
                autoFocus
              />

              {/* Password input */}
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                error={validationErrors.password}
                required
                autoComplete="current-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Remember me
                  </span>
                </label>
                
                {onForgotPasswordClick && (
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSocialLogin('microsoft')}
                disabled={loading}
                className="flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#7fba00" d="M13 1h10v10H13z"/>
                  <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                Microsoft
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Register link */}
        {onRegisterClick && (
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
