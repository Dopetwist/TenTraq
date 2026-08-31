import React from 'react';
import './Select.css';

/**
 * Reusable Select Component
 * Provides consistent styling for form selects
 */
export default function Select({
  label,
  error,
  help,
  options = [],
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
      <select
        className={`select-field ${error ? 'input-error' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="input-error-text">{error}</p>
      )}
      {help && !error && (
        <p className="input-help-text">{help}</p>
      )}
    </div>
  );
}
