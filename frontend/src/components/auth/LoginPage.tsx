/**
 * @fileoverview Login Page Component
 * @description Authentication page with image background following Mantine's design patterns
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Stack,
  Alert,
  Group,
  ThemeIcon
} from '@mantine/core';
import {
  IconChecklist,
  IconAlertCircle
} from '@tabler/icons-react';
import DarkVeil from '../ui/DarkVeil';
import classes from './LoginPage.module.css';

interface LoginPageProps {
  /** Function called when login is successful */
  onLogin?: (credentials: { identifier: string; password: string; rememberMe: boolean }) => void;
  /** Function called when register link is clicked */
  onRegister?: () => void;
  /** Loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
}

export function LoginPage({ onLogin, onRegister, loading = false, error }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{identifier?: string; password?: string}>({});

  const validateForm = () => {
    const errors: {identifier?: string; password?: string} = {};
    
    if (!identifier.trim()) {
      errors.identifier = 'Username or email is required';
    } else if (identifier.trim().length < 3) {
      errors.identifier = 'Username must be at least 3 characters or a valid email';
    }
    
    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm() && onLogin) {
      onLogin({ identifier: identifier.trim(), password, rememberMe });
    }
  };

  return (
    <div className={classes.wrapper}>
      {/* Animated Dark Veil Background */}
      <DarkVeil 
        hueShift={21}
        noiseIntensity={0}
        scanlineIntensity={0.1}
        speed={3}
        scanlineFrequency={5}
        warpAmount={5}
        resolutionScale={0.8}
      />
      
      <Paper className={classes.form}>
        <Group justify="center" mb="xl">
          <ThemeIcon size="xl" variant="light" color="primary">
            <IconChecklist size={32} stroke={1.5} />
          </ThemeIcon>
        </Group>
        
        <Title order={2} className={classes.title}>
          Welcome to TaaskMaaster!
        </Title>

        {error && (
          <Alert 
            icon={<IconAlertCircle size={16} />} 
            color="red" 
            mb="md"
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Username or Email"
              placeholder="username or your@email.com"
              size="md"
              radius="md"
              value={identifier}
              onChange={(e) => setIdentifier(e.currentTarget.value)}
              error={validationErrors.identifier}
              disabled={loading}
              required
            />
            
            <PasswordInput
              label="Password"
              placeholder="Your password"
              size="md"
              radius="md"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={validationErrors.password}
              disabled={loading}
              required
            />
            
            <Checkbox
              label="Keep me logged in"
              size="md"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.currentTarget.checked)}
              disabled={loading}
            />
            
            <Button
              type="submit"
              fullWidth
              size="md"
              radius="md"
              loading={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="xl" size="sm">
          Don&apos;t have an account?{' '}
          <Anchor
            href="#"
            fw={500}
            onClick={(event) => {
              event.preventDefault();
              onRegister?.();
            }}
          >
            Create Account
          </Anchor>
        </Text>

        <Text ta="center" mt="md" size="xs" c="dimmed">
          Forgot your password?{' '}
          <Anchor
            href="#"
            size="xs"
            onClick={(event) => {
              event.preventDefault();
              // Handle forgot password
              console.log('Forgot password clicked');
            }}
          >
            Reset it here
          </Anchor>
        </Text>
      </Paper>
    </div>
  );
}