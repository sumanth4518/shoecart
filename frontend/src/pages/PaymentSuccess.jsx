import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { fetchCart } from '../store/cartSlice';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!sessionId) {
      setError('No Stripe checkout session ID found in request.');
      setLoading(false);
      return;
    }

    let isMounted = true;
    const verifyPayment = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(`/api/payments/verify-session/${sessionId}`, config);
        if (isMounted) {
          setPaymentDetails(data);
          setLoading(false);
          // Refresh customer's cart so frontend shows cleared bag
          dispatch(fetchCart());
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.detail || 'Failed to verify payment status with backend.');
          setLoading(false);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [sessionId, user, navigate, dispatch]);

  // LOADING STATE
  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', maxWidth: '580px', textAlign: 'center' }}>
        <div className="luxury-card" style={{ padding: '3.5rem 2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              border: '3px solid rgba(255, 115, 0, 0.2)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem auto',
              animation: 'spin 1s linear infinite'
            }}
          />
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>
            Verifying Stripe Payment...
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Communicating with Stripe Test Gateway and confirming your transaction securely.
          </p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="container" style={{ padding: '5rem 1rem', maxWidth: '580px', textAlign: 'center' }}>
        <div className="luxury-card" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}
          >
            <AlertTriangle size={36} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.5rem' }}>
            Payment Verification Notice
          </h2>
          <p style={{ color: '#ef4444', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/checkout" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
              Back to Checkout
            </Link>
            <Link to="/orders" className="btn btn-outline" style={{ padding: '0.8rem 1.5rem' }}>
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = paymentDetails?.status === 'PAID';

  return (
    <div className="container" style={{ padding: '4.5rem 1rem', maxWidth: '620px', textAlign: 'center' }}>
      <div className="luxury-card" style={{ padding: '3rem 2.25rem' }}>
        
        {/* Status Icon */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: isPaid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(234, 179, 8, 0.12)',
            border: `2px solid ${isPaid ? '#22c55e' : '#eab308'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}
        >
          {isPaid ? (
            <CheckCircle2 size={44} color="#22c55e" />
          ) : (
            <Clock size={44} color="#eab308" />
          )}
        </div>

        <span
          className="badge"
          style={{
            background: isPaid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: isPaid ? '#22c55e' : '#eab308',
            border: `1px solid ${isPaid ? '#22c55e' : '#eab308'}`,
            marginBottom: '0.75rem',
            padding: '0.35rem 0.85rem',
            fontWeight: 700
          }}
        >
          {isPaid ? 'Payment Confirmed &bull; Stripe Test Mode' : 'Payment Processing'}
        </span>

        <h1 style={{ fontSize: '1.85rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 800 }}>
          {isPaid ? 'Thank You For Your Purchase!' : 'Order Received, Awaiting Confirmation'}
        </h1>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          {isPaid
            ? 'Your payment was successfully authorized via Stripe. We are now preparing your kicks for fulfillment.'
            : 'Your order was recorded. Stripe payment verification is being finalized in the background.'}
        </p>

        {/* Transaction Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            textAlign: 'left',
            marginBottom: '2rem',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Order Reference:</span>
            <strong style={{ color: '#fff', letterSpacing: '0.5px' }}>
              #{paymentDetails?.order_number || paymentDetails?.order_id}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Payment Gateway:</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> Stripe Test Checkout
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Payment Status:</span>
            <span style={{ color: isPaid ? '#22c55e' : '#eab308', fontWeight: 700 }}>
              {paymentDetails?.status}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Total Paid:</span>
            <span style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '1.2rem' }}>
              ₹{Number(paymentDetails?.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/orders" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Track Order Status <ArrowRight size={18} />
          </Link>
          <Link to="/" className="btn btn-outline" style={{ padding: '0.85rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} /> Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;
