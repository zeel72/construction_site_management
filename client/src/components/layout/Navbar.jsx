import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { FiLogOut, FiMenu } from 'react-icons/fi';
import './layout.css';

const Navbar = ({ toggleSidebar }) => {
  const { logout } = useAuth();

  return (
    <header className="navbar glass-panel">
      <div className="navbar-left">
        <button className="mobile-toggle" onClick={toggleSidebar}>
          <FiMenu size={24} />
        </button>
        <h2 className="page-title">Construction Site Management</h2>
      </div>
      
      <div className="navbar-right">
        <Button variant="ghost" onClick={logout} icon={<FiLogOut />} className="logout-btn">
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
