import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Logged in successfully');
      navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-color)' }}>🏗️ CSMS</h1>
          <p className="text-muted">Sign in to manage your construction sites</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            isLoading={loading}
          >
            Sign In
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
