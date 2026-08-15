import React from 'react';

const Card = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div className={`card ${noPadding ? 'p-0' : ''} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
