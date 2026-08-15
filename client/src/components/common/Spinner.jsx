import React from 'react';

const Spinner = ({ fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="flex-center" style={{ height: '100vh', width: '100vw', background: 'var(--bg-main)' }}>
        <div className="spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="flex-center" style={{ padding: '2rem' }}>
      <div className="spinner-md"></div>
    </div>
  );
};

export default Spinner;
