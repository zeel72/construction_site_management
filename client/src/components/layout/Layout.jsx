import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import './layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { siteId } = useParams(); // Extract siteId from URL if present

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="app-container">
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar siteId={siteId} />
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <div className="main-content">
        <Navbar toggleSidebar={toggleSidebar} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
