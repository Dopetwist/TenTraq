import React from 'react';
import './Input.css';

/**
 * Reusable Input Component
 * Provides consistent styling for form inputs
 */
export default function Input({
  label,
  error,
  help,
  className = '',
  ...props
}) {
  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      <input
        className={`input-field ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="input-error-text">{error}</p>
      )}
      {help && !error && (
        <p className="input-help-text">{help}</p>
      )}
    </div>
  );
}
