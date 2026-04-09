import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: '400px' }}
        className="clean-panel"
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>Welcome Back</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="clean-input" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="clean-input" required />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Login</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          New here? <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
};

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, { name, email, password });
      login(data, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ width: '100%', maxWidth: '400px' }}
        className="clean-panel"
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>Join the System</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="clean-input" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="clean-input" required />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="clean-input" required />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Register</button>
        </form>
        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Login</Link>
        </p>
      </motion.div>
    </div>
  );
};
