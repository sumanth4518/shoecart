import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { XCircle, ShoppingBag, ArrowLeft, RefreshCw, CreditCard, Info } from 'lucide-react';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // If order_id was provided, notify backend to safely release reserved stock
    if (orderId && user) {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      axios.post(`/api/payments/cancel/${orderId}`, {}, config).catch(() => {
        // Safe ignore
      });
    }
  }, [orderId, user]);

  return (
    <div className="container" style={{ padding: '4.5rem 1rem', maxWidth: '620px', textAlign: 'center' }}>
      <div className="luxury-card" style={{ padding: '3rem 2.25rem' }}>
        
        {/* Cancel Icon */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          <XCircle size={44} color="#ef4444" />
        </div>

        <span
          className="badge"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444',
            border: '1px solid #ef4444',
            marginBottom: '0.75rem',
            padding: '0.35rem 0.85rem',
            fontWeight: 700
          }}
        >
          Checkout Cancelled
        </span>

        <h1 style={{ fontSize: '1.85rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
          Payment Was Not Completed
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          You cancelled the Stripe checkout session. No charges were made to your card, and your cart items are still saved.
        </p>

        {/* Test Card Guide */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Info size={16} /> Stripe Test Card Testing Reference:
          </div>
          <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <div>&bull; <strong style={{ color: '#fff' }}>Successful Payment:</strong> <code>4242 4242 4242 4242</code></div>
            <div>&bull; <strong style={{ color: '#fff' }}>Declined Card:</strong> <code>4000 0000 0000 9995</code></div>
            <div>&bull; <strong style={{ color: '#fff' }}>3D Secure Auth:</strong> <code>4000 0025 0000 3155</code></div>
            <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Expiry: Any future date (e.g. 12/28) &bull; CVC: Any 3 digits (e.g. 123)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/checkout"
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} /> Retry Payment
          </Link>
          <Link
            to="/cart"
            className="btn btn-outline"
            style={{ padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShoppingBag size={18} /> Return to Cart
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentCancel;
