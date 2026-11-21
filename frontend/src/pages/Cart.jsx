import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { fetchCart, removeFromCart, addToCart } from '../store/cartSlice';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, isLoading } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    } else {
      navigate('/login');
    }
  }, [user, dispatch, navigate]);

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
    toast.info('Item removed from cart');
  };

  const handleQuantityChange = (item, newQty) => {
    if (newQty <= 0) {
      handleRemove(item.product_id);
    } else {
      // Calculate delta
      const delta = newQty - item.quantity;
      dispatch(addToCart({
        productId: item.product_id,
        variantId: item.variant_id,
        size: item.size,
        quantity: delta
      }));
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 1500 || subtotal === 0 ? 0 : 99;
  const finalTotal = subtotal + deliveryFee;

  if (isLoading && cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-primary)' }}>Loading your bag...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <ShoppingBag size={28} color="var(--color-primary)" />
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', color: '#fff' }}>Your Shopping Bag</h1>
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>
          ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
        </span>
      </div>

      {cartItems.length === 0 ? (
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
            <ShoppingBag size={32} color="var(--color-text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.75rem' }}>Your bag is currently empty</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Discover our curated footwear catalogue of high-heat sneakers and performance runners.
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            Explore Catalogue
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cartItems.map((item) => (
              <div
                key={`${item.product_id}-${item.variant_id || item.size}`}
                className="luxury-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem',
                  gap: '1.25rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Image & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: '1 1 240px' }}>
                  <div style={{
                    width: '84px',
                    height: '84px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    padding: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'}
                      alt={item.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.3rem' }}>{item.name}</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <span>Size: <strong style={{ color: 'var(--color-primary)' }}>{item.size || 'UK 8'}</strong></span>
                      {item.colour && <span>Colour: <strong>{item.colour}</strong></span>}
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'block', marginTop: '0.4rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper & Remove */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.2rem'
                  }}>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity - 1)}
                      style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      -
                    </button>
                    <span style={{ width: '30px', textAlign: 'center', fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item, item.quantity + 1)}
                      style={{ width: '32px', height: '32px', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem' }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="btn-icon"
                    title="Remove item"
                    style={{ color: 'var(--color-error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Card */}
          <div className="luxury-card" style={{ padding: '1.75rem', position: 'sticky', top: '90px' }}>
            <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', color: '#fff', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
              Order Breakdown
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              <span>Subtotal</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.85rem', fontSize: '0.95rem', color: 'var(--color-text-secondary)' }}>
              <span>Delivery Fee</span>
              {deliveryFee === 0 ? (
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
              ) : (
                <span style={{ color: '#fff', fontWeight: 700 }}>₹{deliveryFee}</span>
              )}
            </div>

            {deliveryFee > 0 && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginBottom: '1rem' }}>
                Add ₹{(1500 - subtotal).toLocaleString('en-IN')} more to unlock FREE Express Shipping!
              </p>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderTop: '1px solid var(--color-border)',
              paddingTop: '1.25rem',
              marginTop: '1.25rem',
              marginBottom: '1.75rem'
            }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Total Amount</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                ₹{finalTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            >
              Proceed to Checkout
              <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} color="var(--color-primary)" />
              Encrypted Checkout &bull; Verified Authentic
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Cart;
