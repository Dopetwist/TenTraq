import React from 'react';
import './Card.css';

/**
 * Reusable Card Component
 * Provides consistent styling for card-based layouts
 */
export default function Card({
  children,
  className = '',
  bordered = true,
  hover = false,
  ...props
}) {
  const classes = `card ${bordered ? 'card-bordered' : ''} ${hover ? 'card-hover' : ''} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
