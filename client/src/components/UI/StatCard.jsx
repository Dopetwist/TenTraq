import React from 'react';
import './StatCard.css';

/**
 * Reusable StatCard Component
 * Displays statistics with icon, label, and value
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className = '',
  ...props
}) {
  return (
    <div
      className={`stat-card ${className}`}
      {...props}
    >
      <div className="stat-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {trend && (
          <p className="stat-trend">{trend}</p>
        )}
      </div>
      {Icon && (
        <div className="stat-icon">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}
