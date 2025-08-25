# TaaskMaaster Design System

## Overview

The TaaskMaaster Design System is a comprehensive, family-friendly design system built with modern web technologies. It provides a consistent, accessible, and engaging user experience across all platforms and devices.

## Design Philosophy

- **Family-First**: Intuitive interface suitable for all ages
- **Gamification-Centric**: Engaging visual elements that encourage task completion
- **Modern Aesthetics**: Clean, contemporary design with glassmorphism and micro-interactions
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Mobile-First**: Responsive design optimized for all devices

## Design Tokens

### Colors

The design system uses a carefully crafted color palette that supports both light and dark modes:

#### Primary Colors (Blue)
- **Primary 500**: `#3B82F6` - Main brand color
- **Primary 700**: `#1D4ED8` - Darker primary for emphasis
- **Primary 50-950**: Complete range for various use cases

#### Secondary Colors (Green)
- **Secondary 500**: `#10B981` - Success states and positive actions
- **Secondary 50-950**: Complete range for success variations

#### Accent Colors (Orange)
- **Accent 500**: `#F59E0B` - Gamification elements and highlights
- **Accent 50-950**: Complete range for gamification variations

#### Neutral Colors (Gray)
- **Neutral 50-950**: Complete grayscale for text, backgrounds, and borders

#### Semantic Colors
- **Success**: Green variants for positive feedback
- **Warning**: Yellow/Orange variants for caution states
- **Error**: Red variants for error states
- **Info**: Blue variants for informational content

### Typography

The design system uses Inter as the primary font family with a comprehensive type scale:

#### Font Families
- **Sans**: `Inter, system-ui, sans-serif` - Primary text
- **Mono**: `JetBrains Mono, Consolas, Monaco, monospace` - Code and technical content

#### Font Weights
- **Thin**: 100
- **Light**: 300
- **Normal**: 400 - Regular body text
- **Medium**: 500
- **Semibold**: 600 - Headings
- **Bold**: 700 - Bold headings
- **Extrabold**: 800
- **Black**: 900

#### Font Sizes
- **XS**: 12px - Captions and small text
- **SM**: 14px - Small body text
- **Base**: 16px - Default body text
- **LG**: 18px - Large body text
- **XL**: 20px - Small headings
- **2XL**: 24px - Medium headings
- **3XL**: 30px - Large headings
- **4XL**: 36px - Extra large headings
- **5XL**: 48px - Display text

### Spacing

The design system uses a 4px base unit for consistent spacing:

#### Spacing Scale
- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **24**: 96px

#### Border Radius
- **None**: 0px
- **SM**: 2px
- **Base**: 4px
- **MD**: 6px
- **LG**: 8px
- **XL**: 12px
- **2XL**: 16px
- **3XL**: 24px
- **Full**: 9999px (fully rounded)

#### Shadows
- **None**: No shadow
- **SM**: Subtle shadow
- **Base**: Default shadow
- **MD**: Medium shadow
- **LG**: Large shadow
- **XL**: Extra large shadow
- **2XL**: Maximum shadow
- **Inner**: Inset shadow
- **Glass**: Glassmorphism effect

## Components

### Button

A versatile button component with multiple variants, sizes, and states.

#### Variants
- **Primary**: Blue background for main actions
- **Secondary**: Green background for success actions
- **Accent**: Orange background for gamification
- **Outline**: Transparent with border
- **Ghost**: Minimal styling
- **Danger**: Red background for destructive actions
- **Success**: Green background for positive actions
- **Warning**: Yellow background for caution actions

#### Sizes
- **XS**: Extra small (32px height)
- **SM**: Small (36px height)
- **MD**: Medium (40px height) - Default
- **LG**: Large (48px height)
- **XL**: Extra large (56px height)

#### Features
- Loading states with spinner
- Icon support (left/right)
- Full width option
- Disabled states
- Accessibility features

```tsx
import { Button } from '@/design-system';

// Basic usage
<Button>Click me</Button>

// With variants and icons
<Button 
  variant="primary" 
  size="lg" 
  leftIcon={<PlusIcon />}
  loading={isLoading}
>
  Create Task
</Button>
```

### Input

A comprehensive input component with validation states and accessibility features.

#### Variants
- **Default**: Standard input styling
- **Filled**: Background filled variant
- **Outline**: Bordered variant
- **Ghost**: Minimal styling

#### States
- **Default**: Normal state
- **Error**: Red styling for errors
- **Success**: Green styling for success
- **Warning**: Yellow styling for warnings

#### Features
- Label and helper text support
- Icon support (left/right)
- Character count
- Validation states
- Accessibility features

```tsx
import { Input } from '@/design-system';

// Basic usage
<Input label="Email" placeholder="Enter your email" />

// With validation
<Input 
  label="Password"
  type="password"
  error="Password is required"
  showCharacterCount
  maxLength={50}
/>
```

### Card

A flexible card component for displaying content in organized containers.

#### Variants
- **Default**: Standard card with subtle shadow
- **Elevated**: Card with prominent shadow
- **Outlined**: Card with border emphasis
- **Ghost**: Transparent card
- **Glass**: Glassmorphism effect
- **Interactive**: Hover effects for clickable cards

#### Sizes
- **SM**: Small padding (12px)
- **MD**: Medium padding (16px) - Default
- **LG**: Large padding (24px)
- **XL**: Extra large padding (32px)

#### Features
- Header, body, and footer sections
- Image support
- Loading states
- Interactive variants

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/design-system';

<Card variant="elevated" size="lg">
  <CardHeader title="Task Title" subtitle="Task description" />
  <CardBody>
    <p>Task content goes here...</p>
  </CardBody>
  <CardFooter actions={<Button>Complete</Button>} />
</Card>
```

### Modal

A fully accessible modal component with backdrop and keyboard support.

#### Sizes
- **SM**: Small modal (384px max width)
- **MD**: Medium modal (448px max width) - Default
- **LG**: Large modal (512px max width)
- **XL**: Extra large modal (576px max width)
- **2XL-6XL**: Larger sizes for complex content
- **Full**: Full width modal

#### Variants
- **Default**: Standard white background
- **Glass**: Glassmorphism effect
- **Dark**: Dark theme

#### Features
- Backdrop click to close
- Escape key to close
- Body scroll prevention
- Focus management
- Accessibility features

```tsx
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/design-system';

<Modal 
  isOpen={isOpen} 
  onClose={handleClose}
  title="Create New Task"
>
  <ModalBody>
    <p>Modal content goes here...</p>
  </ModalBody>
  <ModalFooter actions={<Button onClick={handleSave}>Save</Button>} />
</Modal>
```

## Usage Guidelines

### Design Principles

1. **Consistency**: Use design tokens consistently across all components
2. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards
3. **Responsiveness**: Design for mobile-first, then enhance for larger screens
4. **Performance**: Optimize for fast loading and smooth interactions
5. **Usability**: Prioritize user experience and intuitive interactions

### Component Best Practices

1. **Use Semantic HTML**: Always use appropriate HTML elements
2. **Provide Alt Text**: Include descriptive alt text for images
3. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
4. **Focus Management**: Maintain logical focus order
5. **Error Handling**: Provide clear error messages and recovery options

### Color Usage

1. **Primary Colors**: Use for main actions, links, and brand elements
2. **Secondary Colors**: Use for success states and positive feedback
3. **Accent Colors**: Use for gamification elements and highlights
4. **Neutral Colors**: Use for text, backgrounds, and borders
5. **Semantic Colors**: Use appropriately for their intended purpose

### Typography Guidelines

1. **Headings**: Use appropriate heading levels (h1-h6) for hierarchy
2. **Body Text**: Use readable font sizes and line heights
3. **Contrast**: Ensure sufficient color contrast for readability
4. **Spacing**: Use consistent spacing between text elements

## Accessibility

The design system is built with accessibility in mind:

### WCAG 2.1 AA Compliance
- **Color Contrast**: All text meets minimum contrast ratios
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Indicators**: Clear focus indicators for all interactive elements

### Accessibility Features
- **Skip Links**: Skip to main content functionality
- **Focus Management**: Logical focus order and management
- **Error Announcements**: Screen reader announcements for errors
- **Loading States**: Clear loading indicators

## Performance

The design system is optimized for performance:

### Optimization Strategies
- **Tree Shaking**: Only import used components
- **CSS-in-JS**: Efficient styling with minimal runtime overhead
- **Lazy Loading**: Components load only when needed
- **Bundle Size**: Minimal impact on bundle size

### Best Practices
- **Import Only What You Need**: Use specific imports
- **Avoid Unnecessary Re-renders**: Use React.memo and useMemo appropriately
- **Optimize Images**: Use appropriate image formats and sizes
- **Minimize Dependencies**: Keep dependencies minimal and up-to-date

## Getting Started

### Installation

The design system is included in the TaaskMaaster frontend package. No additional installation is required.

### Basic Usage

```tsx
import { Button, Input, Card, Modal } from '@/design-system';

function MyComponent() {
  return (
    <div>
      <Card>
        <CardHeader title="Welcome" />
        <CardBody>
          <Input label="Name" placeholder="Enter your name" />
          <Button variant="primary">Submit</Button>
        </CardBody>
      </Card>
    </div>
  );
}
```

### Customization

The design system can be customized through:

1. **Design Tokens**: Modify colors, typography, and spacing
2. **Component Variants**: Create custom variants for specific use cases
3. **Theme Overrides**: Override default styles when needed
4. **CSS Custom Properties**: Use CSS variables for dynamic theming

## Contributing

When contributing to the design system:

1. **Follow Design Principles**: Maintain consistency and accessibility
2. **Add Documentation**: Document all new components and features
3. **Include Tests**: Add comprehensive tests for new components
4. **Update Tokens**: Update design tokens when adding new styles
5. **Review Accessibility**: Ensure all changes meet accessibility standards

## Version History

- **v1.0.0**: Initial design system implementation
  - Complete design tokens (colors, typography, spacing)
  - Base components (Button, Input, Card, Modal)
  - Accessibility features
  - Comprehensive documentation
