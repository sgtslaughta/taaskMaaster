/**
 * @fileoverview Input component for the TaaskMaaster design system
 * @description A versatile input component with multiple variants, sizes, and validation states
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { forwardRef, InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * @description Input variant configurations
 */
const inputVariants = cva(
  // Base styles
  [
    'block w-full transition-all duration-200',
    'border border-gray-300 rounded-md',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'placeholder:text-gray-400',
  ],
  {
    variants: {
      variant: {
        default: 'bg-white text-gray-900',
        filled: 'bg-gray-50 text-gray-900 border-gray-200',
        outline: 'bg-transparent text-gray-900 border-gray-300',
        ghost: 'bg-transparent text-gray-900 border-transparent',
      },
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
        xl: 'px-6 py-4 text-lg',
      },
      state: {
        default: '',
        error: [
          'border-red-500 text-red-900',
          'focus:ring-red-500 focus:border-red-500',
          'placeholder:text-red-400',
        ],
        success: [
          'border-green-500 text-green-900',
          'focus:ring-green-500 focus:border-green-500',
          'placeholder:text-green-400',
        ],
        warning: [
          'border-yellow-500 text-yellow-900',
          'focus:ring-yellow-500 focus:border-yellow-500',
          'placeholder:text-yellow-400',
        ],
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      state: 'default',
      fullWidth: true,
    },
  }
);

/**
 * @description Input component props interface
 */
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /**
   * @description Label for the input
   */
  label?: string;
  /**
   * @description Helper text below the input
   */
  helperText?: string;
  /**
   * @description Error message
   */
  error?: string;
  /**
   * @description Success message
   */
  success?: string;
  /**
   * @description Warning message
   */
  warning?: string;
  /**
   * @description Left icon component
   */
  leftIcon?: React.ReactNode;
  /**
   * @description Right icon component
   */
  rightIcon?: React.ReactNode;
  /**
   * @description Whether to show character count
   */
  showCharacterCount?: boolean;
  /**
   * @description Maximum character count
   */
  maxLength?: number;
  /**
   * @description Whether the input is required
   */
  required?: boolean;
  /**
   * @description Input group wrapper
   */
  wrapperClassName?: string;
  /**
   * @description Label wrapper className
   */
  labelClassName?: string;
  /**
   * @description Input wrapper className
   */
  inputWrapperClassName?: string;
  /**
   * @description Message wrapper className
   */
  messageClassName?: string;
}

/**
 * @description Input component
 * @param props - Input component props
 * @param ref - Forwarded ref
 * @returns Input component
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      fullWidth,
      label,
      helperText,
      error,
      success,
      warning,
      leftIcon,
      rightIcon,
      showCharacterCount = false,
      maxLength,
      required = false,
      wrapperClassName,
      labelClassName,
      inputWrapperClassName,
      messageClassName,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const messageId = `${inputId}-message`;
    const characterCount = props.value?.toString().length || 0;
    
    // Determine state based on props
    const inputState = error ? 'error' : success ? 'success' : warning ? 'warning' : state;
    
    // Determine message to show
    const message = error || success || warning || helperText;
    const messageType = error ? 'error' : success ? 'success' : warning ? 'warning' : 'helper';

    return (
      <div className={cn('space-y-1', wrapperClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-gray-700',
              required && 'after:content-["*"] after:ml-0.5 after:text-red-500',
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Input wrapper */}
        <div className={cn('relative', inputWrapperClassName)}>
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ variant, size, state: inputState, fullWidth }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-describedby={message ? messageId : undefined}
            aria-invalid={!!error}
            maxLength={maxLength}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Message and character count */}
        {(message || (showCharacterCount && maxLength)) && (
          <div className={cn('flex items-center justify-between', messageClassName)}>
            {/* Message */}
            {message && (
              <p
                id={messageId}
                className={cn(
                  'text-sm',
                  {
                    'text-red-600': messageType === 'error',
                    'text-green-600': messageType === 'success',
                    'text-yellow-600': messageType === 'warning',
                    'text-gray-500': messageType === 'helper',
                  }
                )}
              >
                {message}
              </p>
            )}

            {/* Character count */}
            {showCharacterCount && maxLength && (
              <span
                className={cn(
                  'text-xs text-gray-500',
                  characterCount > maxLength * 0.9 && 'text-yellow-600',
                  characterCount > maxLength && 'text-red-600'
                )}
              >
                {characterCount}/{maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * @description Input group component props interface
 */
export interface InputGroupProps {
  /**
   * @description Children input components
   */
  children: React.ReactNode;
  /**
   * @description Additional CSS classes
   */
  className?: string;
  /**
   * @description Label for the input group
   */
  label?: string;
  /**
   * @description Helper text for the input group
   */
  helperText?: string;
  /**
   * @description Error message for the input group
   */
  error?: string;
}

/**
 * @description Input group component for grouping related inputs
 * @param props - Input group props
 * @returns Input group component
 */
export const InputGroup: React.FC<InputGroupProps> = ({
  children,
  className,
  label,
  helperText,
  error,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex">
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              className: cn(
                child.props.className,
                {
                  'rounded-r-none': index === 0 && React.Children.count(children) > 1,
                  'rounded-l-none rounded-r-none': index > 0 && index < React.Children.count(children) - 1,
                  'rounded-l-none': index === React.Children.count(children) - 1 && React.Children.count(children) > 1,
                }
              ),
            });
          }
          return child;
        })}
      </div>

      {(helperText || error) && (
        <p
          className={cn(
            'text-sm',
            error ? 'text-red-600' : 'text-gray-500'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

InputGroup.displayName = 'InputGroup';
