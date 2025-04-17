import React from 'react';
import '../styles/Dashboard.css'; // Reuse dashboard styles for consistency

const SkeletonPasswordItem = () => {
  return (
    <div className="password-item skeleton-item">
      <div className="password-item-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="password-item-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
      <div className="password-value">
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-button skeleton-copy-button"></div>
      </div>
    </div>
  );
};

export default SkeletonPasswordItem;