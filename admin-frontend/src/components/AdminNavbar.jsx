import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Flame, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  Activity, 
  Server
} from 'lucide-react';
import { logout, reset } from '../store/authSlice';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  return (
    <header style={{
      backgroundColor: 'rgba(10, 10, 10, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0.85rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Brand & Console Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: '38px',
              height: '38px',
              backgroundColor: 'var(--color-primary)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px var(--color-primary-glow)'
            }}>
              <Flame size={24} color="#000000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#FFFFFF',
                lineHeight: 1.1
              }}>
                AURA<span style={{ color: 'var(--color-primary)' }}>KICKS</span>
              </div>
              <span style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700 }}>
                Admin Command Console
              </span>
            </div>
          </Link>

          <span className="badge badge-orange" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
            PORTAL v2.0
          </span>
        </div>

        {/* Center / Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* System Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.8rem',
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.78rem',
            color: 'var(--color-text-secondary)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block', boxShadow: '0 0 8px var(--color-success)' }} />
            <span>FastAPI Engine: Active</span>
          </div>

          {/* Link to Customer Storefront */}
          <a 
            href="http://localhost:3000" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--color-text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }}
          >
            <span>Customer Storefront</span>
            <ExternalLink size={14} />
          </a>

          {/* User Account / Sign Out */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.8rem',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-full)'
              }}>
                <ShieldCheck size={16} color="var(--color-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                  {user.name || 'Administrator'}
                </span>
              </div>

              <button 
                onClick={onLogout} 
                className="btn-icon" 
                title="Sign Out of Console" 
                style={{ cursor: 'pointer', color: 'var(--color-error)' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

export default AdminNavbar;
