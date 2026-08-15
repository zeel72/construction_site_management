import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Button from './Button';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className="modal-content">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-container {
          background-color: var(--bg-card);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-lg);
          animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast);
        }
        .modal-close:hover {
          background-color: var(--bg-main);
          color: var(--danger);
        }
        .modal-content {
          padding: 1.5rem;
          overflow-y: auto;
        }
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background-color: var(--bg-main);
          border-bottom-left-radius: var(--radius-lg);
          border-bottom-right-radius: var(--radius-lg);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Modal;
