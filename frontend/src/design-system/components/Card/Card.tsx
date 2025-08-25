/**
 * @fileoverview Card component for the TaaskMaaster design system
 * @description A versatile card component with multiple variants, sizes, and layout options
 * @author TaaskMaaster Team
 * @version 1.0.0
 */

import React, { forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * @description Card variant configurations
 */
const cardVariants = cva(
  // Base styles
  [
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md',
        elevated: 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg',
        outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600',
        ghost: 'bg-transparent border-transparent shadow-none',
        glass: 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 shadow-lg',
        interactive: 'bg-white dark:bg-gray-800 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.02]',
      },
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      clickable: {
        true: 'cursor-pointer hover:shadow-md transition-shadow',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      fullWidth: true,
      clickable: false,
    },
  }
);

/**
 * @description Card component props interface
 */
export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /**
   * @description Card header content
   */
  header?: React.ReactNode;
  /**
   * @description Card footer content
   */
  footer?: React.ReactNode;
  /**
   * @description Card image
   */
  image?: React.ReactNode;
  /**
   * @description Whether the card is loading
   */
  loading?: boolean;
  /**
   * @description Loading skeleton component
   */
  loadingSkeleton?: React.ReactNode;
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
   * @description Image wrapper className
   */
  imageClassName?: string;
}

/**
 * @description Default loading skeleton component
 */
const DefaultLoadingSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
);

/**
 * @description Card component
 * @param props - Card component props
 * @param ref - Forwarded ref
 * @returns Card component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      clickable,
      header,
      footer,
      image,
      loading = false,
      loadingSkeleton,
      headerClassName,
      bodyClassName,
      footerClassName,
      imageClassName,
      children,
      ...props
    },
    ref
  ) => {
    const skeleton = loadingSkeleton || <DefaultLoadingSkeleton />;

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants({ variant, size, fullWidth, clickable }),
          className
        )}
        {...props}
      >
        {/* Image */}
        {image && (
          <div className={cn('overflow-hidden', imageClassName)}>
            {image}
          </div>
        )}

        {/* Header */}
        {header && (
          <div className={cn('border-b border-gray-200 pb-3 mb-3', headerClassName)}>
            {header}
          </div>
        )}

        {/* Body */}
        <div className={cn('flex-1', bodyClassName)}>
          {loading ? skeleton : children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={cn('border-t border-gray-200 pt-3 mt-3', footerClassName)}>
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * @description Card header component props interface
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
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
 * @description Card header component
 * @param props - Card header props
 * @returns Card header component
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  title,
  subtitle,
  actions,
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
          <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', titleClassName)}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', subtitleClassName)}>
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {actions && (
        <div className={cn('flex-shrink-0 ml-4', actionsClassName)}>
          {actions}
        </div>
      )}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * @description Card body component props interface
 */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * @description Card body component
 * @param props - Card body props
 * @returns Card body component
 */
export const CardBody: React.FC<CardBodyProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('flex-1', className)} {...props}>
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

/**
 * @description Card footer component props interface
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
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
 * @description Card footer component
 * @param props - Card footer props
 * @returns Card footer component
 */
export const CardFooter: React.FC<CardFooterProps> = ({
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
        <div className={cn('flex-shrink-0 ml-4', actionsClassName)}>
          {actions}
        </div>
      )}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

/**
 * @description Card image component props interface
 */
export interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * @description Image source
   */
  src: string;
  /**
   * @description Image alt text
   */
  alt: string;
  /**
   * @description Image aspect ratio
   */
  aspectRatio?: 'square' | 'video' | 'wide' | 'ultrawide';
  /**
   * @description Whether to show loading state
   */
  loading?: boolean;
}

/**
 * @description Card image component
 * @param props - Card image props
 * @returns Card image component
 */
export const CardImage: React.FC<CardImageProps> = ({
  className,
  src,
  alt,
  aspectRatio = 'video',
  loading = false,
  ...props
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[16/10]',
    ultrawide: 'aspect-[21/9]',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100 dark:bg-gray-700',
        aspectRatioClasses[aspectRatio],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse" />
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
};

CardImage.displayName = 'CardImage';

// Attach sub-components to Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Image = CardImage;
