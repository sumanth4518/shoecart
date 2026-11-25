import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingBag } from 'lucide-react';
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
    toast.success(`Added ${product.name} (${selectedSize}) to bag!`);
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
        cursor: 'pointer',
        overflow: 'hidden',
        height: '100%'
      }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Top Header: Badges & Wishlist */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
          {discountPercent > 0 && (
            <span className="badge badge-orange" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
              -{discountPercent}%
            </span>
          )}
          {product.is_new_arrival && (
            <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
              DROP
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Wishlist"
          style={{
            background: isWishlisted ? 'rgba(255, 107, 26, 0.18)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isWishlisted ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s',
            flexShrink: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.12)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Heart 
            size={16} 
            color={isWishlisted ? 'var(--color-primary)' : '#9CA3AF'} 
            fill={isWishlisted ? 'var(--color-primary)' : 'none'} 
          />
        </button>
      </div>

      {/* Sneaker Image Container with Hover Micro-Motion */}
      <div className="product-img-box">
        {/* Soft Radial Ambient Aura */}
        <div style={{
          position: 'absolute',
          width: '130px',
          height: '130px',
          background: isHovered 
            ? 'radial-gradient(circle, rgba(255,107,26,0.22) 0%, rgba(8,10,15,0) 70%)' 
            : 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, rgba(8,10,15,0) 70%)',
          borderRadius: '50%',
          transition: 'all 0.35s ease',
          pointerEvents: 'none'
        }} />

        <img
          src={product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
          }}
          style={{
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            transform: isHovered ? 'scale(1.06) rotate(-3deg)' : 'scale(1) rotate(0deg)',
            transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.75))'
          }}
        />
      </div>

      {/* Meta Information & Pricing */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {product.brand || "AURA"}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
            {product.category || "Sneakers"}
          </span>
        </div>

        <h4 style={{
          fontSize: '0.86rem',
          fontWeight: 600,
          color: '#F9FAFB',
          minHeight: '34px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.28,
          marginBottom: '0.35rem'
        }}>
          {product.name}
        </h4>

        {/* Pricing */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.45rem', marginTop: '0.2rem' }}>
          <span style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#FFFFFF'
          }}>
            ₹{Number(currentPrice).toLocaleString('en-IN')}
          </span>
          {discountPercent > 0 && (
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'line-through'
            }}>
              ₹{Number(originalPrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>

      {/* Size Selector & Quick Add */}
      <div style={{ marginTop: '0.65rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.55rem' }}>
        {product.variants && product.variants.length > 0 && (
          <div style={{ display: 'flex', gap: '0.25rem', overflowX: 'auto', paddingBottom: '0.35rem', scrollbarWidth: 'none' }}>
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
                  fontSize: '0.65rem',
                  padding: '0.18rem 0.42rem',
                  borderRadius: '5px',
                  background: selectedSize === v.size ? 'var(--color-primary)' : 'rgba(255,255,255,0.04)',
                  color: selectedSize === v.size ? '#000000' : (v.stock <= 0 ? 'var(--color-text-muted)' : 'var(--color-text-secondary)'),
                  border: `1px solid ${selectedSize === v.size ? 'var(--color-primary)' : 'rgba(255,255,255,0.08)'}`,
                  fontWeight: selectedSize === v.size ? 800 : 500,
                  cursor: v.stock <= 0 ? 'not-allowed' : 'pointer',
                  opacity: v.stock <= 0 ? 0.3 : 1,
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
            marginTop: '0.3rem',
            padding: '0.45rem',
            fontSize: '0.78rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <ShoppingBag size={14} />
          Add ({selectedSize})
        </button>
      </div>
    </div>
  );
};

export default ProductCard;