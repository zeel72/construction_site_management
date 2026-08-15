import React from 'react';

const Input = ({
  label,
  id,
  error,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label htmlFor={id} className="input-label">{label}</label>}
      {type === 'textarea' ? (
        <textarea
          id={id}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={id}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          className={`input-field ${error ? 'input-error' : ''}`}
          {...props}
        />
      )}
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default Input;
