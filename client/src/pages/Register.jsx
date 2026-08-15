import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, confirmPassword } = formData;
    
    if (!name || !email || !phone || !password) {
      return toast.error('Please fill in all required fields');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    // Hardcode role to admin per user request
    const res = await register({ name, email, phone, password, role: 'admin' });
    setLoading(false);

    if (res.success) {
      toast.success('Registration successful');
      navigate('/');
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 1rem' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--primary-color)' }}>🏗️ CSMS</h1>
          <p className="text-muted">Create a new admin account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input label="Full Name" id="name" value={formData.name} onChange={handleChange} required />
          <Input label="Email Address" id="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="Phone Number" id="phone" value={formData.phone} onChange={handleChange} required />
          
          <div className="grid-cols-2">
            <Input label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required />
            <Input label="Confirm Password" id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '1rem' }} isLoading={loading}>
            Register as Admin
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
