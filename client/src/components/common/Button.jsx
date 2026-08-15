import React from 'react';
import './common.css'; // We will put common component styles here

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, danger, outline, ghost
  size = 'md', // sm, md, lg
  className = '',
  isLoading = false,
  disabled = false,
  icon,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const loadingClass = isLoading ? 'btn-loading' : '';

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${loadingClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner-sm"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
