import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingBag, Eye, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import { addToCart } from '../store/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product.variants?.[0]?.size || 'UK 8');

  const isWishlisted = wishlistItems?.some(item => item.id === product.id);

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please sign in to save items to your wishlist');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product.id));
      toast.success('Added to wishlist');
    }
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please sign in to add items to cart');
      navigate('/login');
      return;
    }

    const matchedVariant = product.variants?.find(v => v.size === selectedSize) || product.variants?.[0];
    dispatch(addToCart({ 
      productId: product.id, 
      variantId: matchedVariant?.id, 
      size: selectedSize, 
      quantity: 1 
    }));
    toast.success(`Added ${product.name} (${selectedSize}) to cart!`);
  };

  const currentPrice = product.price || product.base_price;
  const originalPrice = product.base_price;
  const discountPercent = product.discount_percent || (product.discount_price ? Math.round(((originalPrice - product.discount_price) / originalPrice) * 100) : 0);

  return (
    <div 
      className="luxury-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.1rem',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden'
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Top Bar Badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {discountPercent > 0 && (
            <span className="badge badge-orange">
              -{discountPercent}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="badge" style={{ backgroundColor: '#262626', color: '#fff', border: '1px solid #404040' }}>
              NEW
            </span>
          )}
        </div>

        {/* Wishlist Toggle Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Wishlist"
          style={{
            background: isWishlisted ? 'rgba(255, 107, 26, 0.15)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isWishlisted ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart 
            size={18} 
            color={isWishlisted ? 'var(--color-primary)' : '#A3A3A3'} 
            fill={isWishlisted ? 'var(--color-primary)' : 'none'} 
          />
        </button>
      </div>

      {/* Sneaker Image Container with Hover Zoom */}
      <div style={{
        height: '210px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        margin: '0.5rem 0 1rem 0'
      }}>
        {/* Soft Ambient Radial Light behind Shoe */}
        <div style={{
          position: 'absolute',
          width: '160px',
          height: '160px',
          background: isHovered ? 'radial-gradient(circle, rgba(255,107,26,0.18) 0%, rgba(9,9,9,0) 70%)' : 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(9,9,9,0) 70%)',
          borderRadius: '50%',
          transition: 'all 0.4s ease'
        }} />

        <img
          src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'}
          alt={product.name}
          loading="lazy"
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            transform: isHovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.7))'
          }}
        />
      </div>

      {/* Meta Information */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {product.brand || "AURA"}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {product.category || "Footwear"}
          </span>
        </div>

        <h4 style={{
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#FFFFFF',
          minHeight: '40px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.35
        }}>
          {product.name}
        </h4>

        {/* Pricing */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: '0.6rem' }}>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#FFFFFF'
          }}>
            ₹{currentPrice.toLocaleString('en-IN')}
          </span>
          {discountPercent > 0 && (
            <span style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'line-through'
            }}>
              ₹{Number(originalPrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Size Pills & Quick Add Action */}
      <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
        {product.variants && product.variants.length > 0 && (
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.4rem', scrollbarWidth: 'none' }}>
            {product.variants.map((v) => (
              <button
                key={v.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(v.size);
                }}
                disabled={v.stock <= 0}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '6px',
                  background: selectedSize === v.size ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: selectedSize === v.size ? '#000000' : (v.stock <= 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'),
                  border: `1px solid ${selectedSize === v.size ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  fontWeight: selectedSize === v.size ? 800 : 500,
                  cursor: v.stock <= 0 ? 'not-allowed' : 'pointer',
                  opacity: v.stock <= 0 ? 0.35 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {v.size.replace('UK ', '')}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleQuickAdd}
          className="btn btn-secondary"
          style={{
            width: '100%',
            marginTop: '0.4rem',
            padding: '0.55rem',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700
          }}
        >
          <ShoppingBag size={15} />
          Add ({selectedSize})
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
