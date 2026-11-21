import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { fetchWishlist, removeFromWishlist } from '../store/wishlistSlice';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading } = useSelector((state) => state.wishlist);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      dispatch(fetchWishlist());
    }
  }, [user, navigate, dispatch]);

  if (isLoading && items.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-primary)' }}>Loading your saved silhouettes...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Heart size={28} color="var(--color-primary)" fill="var(--color-primary)" />
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', color: '#fff' }}>Saved Wishlist</h1>
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          ({items.length} {items.length === 1 ? 'item' : 'items'})
        </span>
      </div>

      {items.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '4rem 2rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
            <Heart size={32} color="var(--color-text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.75rem' }}>Your wishlist is empty</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Keep track of footwear silhouettes you love and move them directly to your bag.
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            Explore Silhouettes
          </Link>
        </div>
      ) : (
        <div className="grid-catalog">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
