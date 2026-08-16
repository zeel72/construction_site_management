import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiHome, FiMap, FiUsers, FiBox, FiFileText, FiTruck, FiDollarSign } from 'react-icons/fi';
import './layout.css';

const Sidebar = ({ siteId, onClose }) => {
  const { user } = useAuth();

  const globalLinks = [
    { to: '/sites', icon: <FiMap />, label: 'All Sites' },
    { to: '/suppliers', icon: <FiTruck />, label: 'Suppliers' },
    { to: '/parties', icon: <FiUsers />, label: 'Ledger (Khatabook)' },
  ];

  const siteLinks = siteId ? [
    { to: `/sites/${siteId}`, icon: <FiMap />, label: 'Site Overview', end: true },
    { to: `/sites/${siteId}/labours`, icon: <FiUsers />, label: 'Labours & Attendance' },
    { to: `/sites/${siteId}/bills`, icon: <FiBox />, label: 'Materials & Bills' },
    { to: `/sites/${siteId}/payments`, icon: <FiDollarSign />, label: 'Payments' },
  ] : [];

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-brand">
        <h2>🏗️ CSMS</h2>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-title">GLOBAL</span>
          {globalLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive && !siteId ? 'active' : ''}`}
              end={link.to === '/'}
              onClick={onClose}
            >
              {link.icon} <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {siteId && (
          <div className="nav-section">
            <span className="nav-section-title">CURRENT SITE</span>
            {siteLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                end={link.end}
                onClick={onClose}
              >
                {link.icon} <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
