import React from 'react';
import './Badge.css';

/**
 * Reusable Badge Component
 * Status indicators with consistent styling
 * Variants: success, warning, destructive, neutral
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  return (
    <span
      className={`badge badge-${variant} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
