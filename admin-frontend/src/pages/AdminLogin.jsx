import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Lock, Mail, ArrowRight, ExternalLink } from 'lucide-react';
import { login, reset } from '../store/authSlice';

const AdminLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { email, password } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (user) {
      if (user.role === 'admin') {
        navigate('/');
      } else {
        toast.error('Access restricted: Administrator role required.');
      }
    }
    dispatch(reset());
  }, [user, isError, message, navigate, dispatch]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <div className="container" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      
      <div className="luxury-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', border: '1px solid var(--color-primary)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '2px solid var(--color-primary)',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem',
            boxShadow: '0 0 25px var(--color-primary-glow)'
          }}>
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.02em', marginBottom: '0.3rem' }}>
            Admin Console Login
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Dedicated operational gateway for Aura Kicks management
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="admin@blinkit.com"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Security Key / Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="••••••••"
                className="input-control"
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Lock size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
            {!isLoading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            Default test administrator credentials:
          </div>
          <code style={{ display: 'block', background: 'var(--color-elevated)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            admin@blinkit.com / admin123
          </code>
          <a
            href="http://localhost:3000"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-text-secondary)', fontSize: '0.82rem', textDecoration: 'none' }}
          >
            Looking for Customer Storefront? Go to Port 3000 <ExternalLink size={12} />
          </a>
        </div>

      </div>

    </div>
  );
};

export default AdminLogin;
