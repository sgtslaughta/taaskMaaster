/**
 * @fileoverview Modal component for the TaaskMaaster design system
 * @description A versatile modal component with proper accessibility and backdrop handling
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { forwardRef, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * @description Modal variant configurations
 */
const modalVariants = cva(
  // Base styles
  [
    'relative bg-white rounded-lg shadow-xl',
    'transform transition-all duration-200',
    'focus:outline-none',
  ],
  {
    variants: {
      size: {
        sm: 'max-w-sm w-full mx-4',
        md: 'max-w-md w-full mx-4',
        lg: 'max-w-lg w-full mx-4',
        xl: 'max-w-xl w-full mx-4',
        '2xl': 'max-w-2xl w-full mx-4',
        '3xl': 'max-w-3xl w-full mx-4',
        '4xl': 'max-w-4xl w-full mx-4',
        '5xl': 'max-w-5xl w-full mx-4',
        '6xl': 'max-w-6xl w-full mx-4',
        full: 'max-w-full w-full mx-4',
      },
      variant: {
        default: 'bg-white',
        glass: 'bg-white/80 backdrop-blur-sm border border-white/20',
        dark: 'bg-gray-900 text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

/**
 * @description Modal component props interface
 */
export interface ModalProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof modalVariants> {
  /**
   * @description Whether the modal is open
   */
  isOpen: boolean;
  /**
   * @description Function to close the modal
   */
  onClose: () => void;
  /**
   * @description Modal title
   */
  title?: React.ReactNode;
  /**
   * @description Modal subtitle
   */
  subtitle?: React.ReactNode;
  /**
   * @description Whether to show close button
   */
  showCloseButton?: boolean;
  /**
   * @description Whether to close on backdrop click
   */
  closeOnBackdropClick?: boolean;
  /**
   * @description Whether to close on escape key
   */
  closeOnEscape?: boolean;
  /**
   * @description Whether to prevent body scroll when open
   */
  preventBodyScroll?: boolean;
  /**
   * @description Modal header content
   */
  header?: React.ReactNode;
  /**
   * @description Modal footer content
   */
  footer?: React.ReactNode;
  /**
   * @description Backdrop wrapper className
   */
  backdropClassName?: string;
  /**
   * @description Header wrapper className
   */
  headerClassName?: string;
  /**
   * @description Body wrapper className
   */
  bodyClassName?: string;
  /**
   * @description Footer wrapper className
   */
  footerClassName?: string;
  /**
   * @description Close button className
   */
  closeButtonClassName?: string;
}

/**
 * @description Modal component
 * @param props - Modal component props
 * @param ref - Forwarded ref
 * @returns Modal component
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      className,
      size,
      variant,
      isOpen,
      onClose,
      title,
      subtitle,
      showCloseButton = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      preventBodyScroll = true,
      header,
      footer,
      backdropClassName,
      headerClassName,
      bodyClassName,
      footerClassName,
      closeButtonClassName,
      children,
      ...props
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, onClose]);

    // Handle body scroll
    useEffect(() => {
      if (!preventBodyScroll) return;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, preventBodyScroll]);

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Focus management
    useEffect(() => {
      if (isOpen && modalRef.current) {
        modalRef.current.focus();
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const modalContent = (
      <div
        className={cn(
          'fixed inset-0 z-50 flex items-center justify-center p-4',
          backdropClassName
        )}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-subtitle' : undefined}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          ref={modalRef}
                  className={cn(
          modalVariants({ size, variant }),
          'relative z-10 max-h-[90vh] overflow-hidden dark:bg-gray-800',
          className
        )}
          tabIndex={-1}
          {...props}
        >
          {/* Header */}
          {(header || title || showCloseButton) && (
            <div className={cn('flex items-start justify-between p-6 pb-0 border-b border-gray-200 dark:border-gray-700', headerClassName)}>
              <div className="flex-1 min-w-0">
                {header ? (
                  header
                ) : (
                  <>
                    {title && (
                      <h2
                        id="modal-title"
                        className="text-lg font-semibold text-gray-900 dark:text-white"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p
                        id="modal-subtitle"
                        className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                      >
                        {subtitle}
                      </p>
                    )}
                  </>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  className={cn(
                    'ml-4 flex-shrink-0 rounded-md p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    closeButtonClassName
                  )}
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={cn('flex-1 overflow-y-auto p-6', bodyClassName)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={cn('flex items-center justify-end gap-3 p-6 pt-0', footerClassName)}>
              {footer}
            </div>
          )}
        </div>
      </div>
    );

    // Render to portal if available
    if (typeof document !== 'undefined') {
      return createPortal(modalContent, document.body);
    }

    return modalContent;
  }
);

Modal.displayName = 'Modal';

/**
 * @description Modal header component props interface
 */
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * @description Header title
   */
  title?: React.ReactNode;
  /**
   * @description Header subtitle
   */
  subtitle?: React.ReactNode;
  /**
   * @description Header actions
   */
  actions?: React.ReactNode;
  /**
   * @description Close button
   */
  closeButton?: React.ReactNode;
  /**
   * @description Title wrapper className
   */
  titleClassName?: string;
  /**
   * @description Subtitle wrapper className
   */
  subtitleClassName?: string;
  /**
   * @description Actions wrapper className
   */
  actionsClassName?: string;
}

/**
 * @description Modal header component
 * @param props - Modal header props
 * @returns Modal header component
 */
export const ModalHeader: React.FC<ModalHeaderProps> = ({
  className,
  title,
  subtitle,
  actions,
  closeButton,
  titleClassName,
  subtitleClassName,
  actionsClassName,
  children,
  ...props
}) => {
  return (
    <div className={cn('flex items-start justify-between', className)} {...props}>
      <div className="flex-1 min-w-0">
        {title && (
          <h2 className={cn('text-lg font-semibold text-gray-900 dark:text-white', titleClassName)}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', subtitleClassName)}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
      <div className="flex items-center gap-2">
        {actions && (
          <div className={cn('flex-shrink-0', actionsClassName)}>
            {actions}
          </div>
        )}
        {closeButton}
      </div>
    </div>
  );
};

ModalHeader.displayName = 'ModalHeader';

/**
 * @description Modal body component props interface
 */
export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * @description Modal body component
 * @param props - Modal body props
 * @returns Modal body component
 */
export const ModalBody: React.FC<ModalBodyProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  );
};

ModalBody.displayName = 'ModalBody';

/**
 * @description Modal footer component props interface
 */
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * @description Footer actions
   */
  actions?: React.ReactNode;
  /**
   * @description Actions wrapper className
   */
  actionsClassName?: string;
}

/**
 * @description Modal footer component
 * @param props - Modal footer props
 * @returns Modal footer component
 */
export const ModalFooter: React.FC<ModalFooterProps> = ({
  className,
  actions,
  actionsClassName,
  children,
  ...props
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)} {...props}>
      <div className="flex-1">{children}</div>
      {actions && (
        <div className={cn('flex items-center gap-2', actionsClassName)}>
          {actions}
        </div>
      )}
    </div>
  );
};

ModalFooter.displayName = 'ModalFooter';
