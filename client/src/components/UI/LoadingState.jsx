import React from 'react';
import './LoadingState.css';

/**
 * Reusable LoadingState Component
 * Displays a loading skeleton or spinner
 */
export default function LoadingState({
  message = 'Loading...',
  type = 'spinner',
  className = '',
  ...props
}) {
  if (type === 'skeleton') {
    return (
      <div className={`loading-skeleton ${className}`} {...props}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-item" />
        ))}
      </div>
    );
  }

  return (
    <div className={`loading-spinner-container ${className}`} {...props}>
      <div className="loading-spinner">
        <div className="spinner-inner" />
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
}
