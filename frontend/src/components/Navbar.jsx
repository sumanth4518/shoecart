import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShoppingBag, 
  Heart, 
  UserRound, 
  LogOut, 
  Search, 
  SlidersHorizontal,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import { logout, reset } from '../store/authSlice';
import { clearCartState } from '../store/cartSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlistItems?.length || 0;

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    dispatch(clearCartState());
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <header style={{
      backgroundColor: 'rgba(9, 9, 9, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.9rem 0'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--color-primary-glow)'
          }}>
            <Flame size={22} color="#000000" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#FFFFFF'
          }}>
            AURA<span style={{ color: 'var(--color-primary)' }}>KICKS</span>
          </span>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '1.8rem' }}>
          <Link 
            to="/" 
            style={{ 
              fontSize: '0.95rem', 
              fontWeight: 600, 
              color: location.pathname === '/' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              transition: 'color 0.2s'
            }}
          >
            Catalog
          </Link>
          <Link 
            to="/?category=Sneakers" 
            style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            Sneakers
          </Link>
          <Link 
            to="/?category=Running+Shoes" 
            style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            Running
          </Link>
          <Link 
            to="/?is_new_arrival=true" 
            style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}
          >
            New Drops
          </Link>
        </nav>

        {/* Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="desktop-search" style={{ flex: '0 1 320px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search silhouettes, brands, UK sizes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-control"
            style={{
              paddingLeft: '2.5rem',
              paddingTop: '0.6rem',
              paddingBottom: '0.6rem',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-full)'
            }}
          />
          <Search size={16} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
        </form>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Wishlist Link */}
          <Link 
            to="/wishlist" 
            className="btn-icon desktop-icon-btn" 
            title="Saved Wishlist" 
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Heart size={20} color={location.pathname === '/wishlist' ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
            {totalWishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--color-primary)',
                color: '#000000',
                fontSize: '0.7rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {totalWishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon & Badge */}
          <Link 
            to="/cart" 
            className="btn-icon" 
            title="Shopping Cart" 
            style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ShoppingBag size={20} color={location.pathname === '/cart' ? 'var(--color-primary)' : 'var(--color-text-secondary)'} />
            {totalCartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--color-primary)',
                color: '#000000',
                fontSize: '0.7rem',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 10px var(--color-primary)'
              }}>
                {totalCartCount}
              </span>
            )}
          </Link>

          {/* User Account / Profile */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Link 
                to="/profile" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.8rem',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600
                }}
              >
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="user-name-label">{user.name?.split(' ')[0]}</span>
              </Link>
              
              <button 
                onClick={onLogout} 
                className="btn-icon" 
                title="Sign Out" 
                style={{ cursor: 'pointer' }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}>
              Sign In
            </Link>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav, .desktop-search {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .desktop-icon-btn, .user-name-label {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;
