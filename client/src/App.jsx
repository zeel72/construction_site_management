import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Spinner from './components/common/Spinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Sites from './pages/Sites';
import Suppliers from './pages/Suppliers';
import SiteDetail from './pages/SiteDetail';
import Labours from './pages/Labours';
import Attendance from './pages/Attendance';
import Materials from './pages/Materials';
import MaterialBills from './pages/MaterialBills';
import Payments from './pages/Payments';
import Parties from './pages/Parties';
import PartyDetail from './pages/PartyDetail';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner fullScreen />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes wrapped in Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Global Dashboard points to all sites view */}
          <Route index element={<Navigate to="/sites" replace />} />
          <Route path="sites" element={<Sites />} />
          <Route path="suppliers" element={<Suppliers />} />
          
          {/* Khatabook Ledger Routes */}
          <Route path="parties" element={<Parties />} />
          <Route path="parties/:id" element={<PartyDetail />} />
          
          {/* Site-specific routes */}
          <Route path="sites/:siteId">
            <Route index element={<SiteDetail />} />
            <Route path="labours" element={<Labours />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="materials" element={<Materials />} />
            <Route path="bills" element={<MaterialBills />} />
            <Route path="payments" element={<Payments />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

