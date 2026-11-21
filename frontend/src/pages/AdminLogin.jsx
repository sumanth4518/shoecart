import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';
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
        navigate('/admin');
      } else {
        toast.error('Access restricted: Administrator role required.');
        navigate('/');
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
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      
      <div className="luxury-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', border: '1px solid var(--color-primary)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'var(--color-primary-subtle)',
            border: '2px solid var(--color-primary)',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={26} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: '#fff', textTransform: 'uppercase' }}>Admin Console</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Restricted access for store managers & operators
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Administrator Email
            </label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              placeholder="admin@blinkit.com"
              className="input-control"
              required
            />
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
              Security Key / Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              className="input-control"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Customer Sign In &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
