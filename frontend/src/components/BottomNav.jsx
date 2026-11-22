import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Home, Search, Share2, ShoppingBag, UserRound } from 'lucide-react';
import ShareModal from './ShareModal';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(user && (user.token || user.access_token));
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsSearchOpen(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsSearchOpen(false);
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <nav 
        className="mobile-bottom-nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '62px',
          backgroundColor: 'rgba(15, 15, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 90,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* 1. HOME */}
        <NavLink
          to="/"
          className={({ isActive }) => `bottom-nav-item ${isActive && location.pathname === '/' ? 'active' : ''}`}
          aria-label="Home"
        >
          <Home size={22} />
        </NavLink>

        {/* 2. SEARCH */}
        <button
          onClick={handleSearchClick}
          className={`bottom-nav-item ${isSearchOpen ? 'active' : ''}`}
          aria-label="Search"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Search size={22} />
        </button>

        {/* 3. SHARE */}
        <button
          onClick={() => setIsShareOpen(true)}
          className="bottom-nav-item"
          aria-label="Share"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Share2 size={22} />
        </button>

        {/* 4. CART */}
        <NavLink
          to="/cart"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          aria-label="Cart"
          style={{ position: 'relative' }}
        >
          <ShoppingBag size={22} />
          {totalCartCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              background: 'var(--color-primary)',
              color: '#000000',
              fontSize: '0.65rem',
              fontWeight: 800,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {totalCartCount}
            </span>
          )}
        </NavLink>

        {/* 5. PROFILE */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          aria-label="Profile"
        >
          <UserRound size={22} />
        </NavLink>
      </nav>

      {/* Mobile Search Bottom Sheet / Dialog */}
      {isSearchOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '2rem 1.25rem'
        }}>
          <div style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Search Footwear</h3>
              <button 
                onClick={() => setIsSearchOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search models, brands, UK sizes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="input-control"
                style={{ marginBottom: '1rem', padding: '1rem' }}
              />
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Explore Sneakers
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareOpen && (
        <ShareModal 
          isOpen={isShareOpen} 
          onClose={() => setIsShareOpen(false)}
          title="AURA KICKS - Premium Footwear E-Commerce"
          url={window.location.origin}
        />
      )}

      <style>{`
        .bottom-nav-item {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 12px;
          color: var(--color-text-muted);
          transition: color 0.2s, transform 0.2s;
        }
        .bottom-nav-item:hover, .bottom-nav-item.active {
          color: var(--color-primary);
          transform: translateY(-2px);
        }
        @media (min-width: 769px) {
          .mobile-bottom-nav {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default BottomNav;
