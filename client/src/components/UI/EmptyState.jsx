import React from 'react';
import './EmptyState.css';

/**
 * Reusable EmptyState Component
 * Displays an empty state with icon, message, and optional action
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  ...props
}) {
  return (
    <div
      className={`empty-state ${className}`}
      {...props}
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={48} />
        </div>
      )}
      <h3 className="empty-state-title">
        {title}
      </h3>
      {description && (
        <p className="empty-state-description">
          {description}
        </p>
      )}
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}
