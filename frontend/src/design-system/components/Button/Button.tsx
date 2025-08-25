/**
 * @fileoverview Button component for the TaaskMaaster design system
 * @description A versatile button component with multiple variants, sizes, and states
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { designTokens } from '../../tokens';

/**
 * @description Button variant configurations
 */
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-blue-600 text-white border border-blue-600',
          'hover:bg-blue-700 hover:border-blue-700',
          'focus:ring-blue-500',
          'active:bg-blue-800',
        ],
        secondary: [
          'bg-green-600 text-white border border-green-600',
          'hover:bg-green-700 hover:border-green-700',
          'focus:ring-green-500',
          'active:bg-green-800',
        ],
        accent: [
          'bg-orange-500 text-white border border-orange-500',
          'hover:bg-orange-600 hover:border-orange-600',
          'focus:ring-orange-400',
          'active:bg-orange-700',
        ],
        outline: [
          'bg-transparent text-blue-600 border border-blue-600',
          'hover:bg-blue-50 hover:text-blue-700',
          'focus:ring-blue-500',
          'active:bg-blue-100',
        ],
        ghost: [
          'bg-transparent text-gray-700 border border-transparent',
          'hover:bg-gray-100 hover:text-gray-900',
          'focus:ring-gray-500',
          'active:bg-gray-200',
        ],
        danger: [
          'bg-red-600 text-white border border-red-600',
          'hover:bg-red-700 hover:border-red-700',
          'focus:ring-red-500',
          'active:bg-red-800',
        ],
        success: [
          'bg-green-600 text-white border border-green-600',
          'hover:bg-green-700 hover:border-green-700',
          'focus:ring-green-500',
          'active:bg-green-800',
        ],
        warning: [
          'bg-yellow-500 text-white border border-yellow-500',
          'hover:bg-yellow-600 hover:border-yellow-600',
          'focus:ring-yellow-400',
          'active:bg-yellow-700',
        ],
      },
      size: {
        xs: 'px-2 py-1 text-xs rounded',
        sm: 'px-3 py-1.5 text-sm rounded',
        md: 'px-4 py-2 text-sm rounded-md',
        lg: 'px-6 py-3 text-base rounded-lg',
        xl: 'px-8 py-4 text-lg rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
      loading: {
        true: 'opacity-75 cursor-wait',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

/**
 * @description Button component props interface
 */
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * @description Loading state for the button
   */
  loading?: boolean;
  /**
   * @description Left icon component
   */
  leftIcon?: React.ReactNode;
  /**
   * @description Right icon component
   */
  rightIcon?: React.ReactNode;
  /**
   * @description Loading spinner component
   */
  loadingSpinner?: React.ReactNode;
  /**
   * @description Children content
   */
  children: React.ReactNode;
}

/**
 * @description Default loading spinner component
 */
const DefaultLoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * @description Button component
 * @param props - Button component props
 * @param ref - Forwarded ref
 * @returns Button component
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      loadingSpinner,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const spinner = loadingSpinner || <DefaultLoadingSpinner />;

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && spinner}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span className="flex-shrink-0">{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * @description Button group component props interface
 */
export interface ButtonGroupProps {
  /**
   * @description Children button components
   */
  children: React.ReactNode;
  /**
   * @description Additional CSS classes
   */
  className?: string;
  /**
   * @description Whether buttons are attached to each other
   */
  attached?: boolean;
  /**
   * @description Vertical orientation
   */
  vertical?: boolean;
}

/**
 * @description Button group component for grouping related buttons
 * @param props - Button group props
 * @returns Button group component
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  attached = false,
  vertical = false,
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        {
          'flex-col': vertical,
          'flex-row': !vertical,
        },
        {
          'divide-x divide-gray-200': attached && !vertical,
          'divide-y divide-gray-200': attached && vertical,
        },
        className
      )}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            className: cn(
              child.props.className,
              attached && {
                'rounded-none': true,
                'rounded-l-md': index === 0 && !vertical,
                'rounded-r-md': index === React.Children.count(children) - 1 && !vertical,
                'rounded-t-md': index === 0 && vertical,
                'rounded-b-md': index === React.Children.count(children) - 1 && vertical,
              }
            ),
          });
        }
        return child;
      })}
    </div>
  );
};

ButtonGroup.displayName = 'ButtonGroup';
