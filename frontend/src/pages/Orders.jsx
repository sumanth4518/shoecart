import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Package, Truck, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/orders', config);
        setOrders(data);
      } catch (error) {
        toast.error('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [user, navigate]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <CheckCircle2 size={13} /> Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="badge badge-orange" style={{ gap: '4px' }}>
            <Truck size={13} /> In Transit
          </span>
        );
      case 'processing':
        return (
          <span className="badge badge-warning" style={{ gap: '4px' }}>
            <Clock size={13} /> Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge" style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', border: '1px solid rgba(239, 68, 68, 0.3)', gap: '4px' }}>
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="badge badge-warning" style={{ gap: '4px' }}>
            <Clock size={13} /> Order Placed
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--color-primary)' }}>Loading your orders...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
        <Package size={28} color="var(--color-primary)" />
        <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', color: '#fff' }}>Order History</h1>
      </div>

      {orders.length === 0 ? (
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
            <Package size={32} color="var(--color-text-muted)" />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.75rem' }}>No orders recorded yet</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            You haven't placed any footwear orders. Discover our new arrivals today.
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.85rem 2rem' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order.id} className="luxury-card" style={{ padding: '1.75rem' }}>
              
              {/* Order Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: '1.25rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>Order #{order.order_number || order.id}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Placed on: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    ₹{Number(order.total_price).toLocaleString('en-IN')}
                  </span>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {order.payment_method === 'stripe' ? (
                      <span style={{ color: order.payment_status === 'PAID' ? '#22c55e' : 'var(--color-warning)', fontWeight: 700 }}>
                        {order.payment_status === 'PAID' ? '✓ Paid via Stripe' : 'Stripe (Pending)'}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        Pay on Delivery
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Order Shipping Details */}
              <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '0.3rem' }}>Delivery Address:</strong>
                {order.address}
              </div>

              {/* Ordered Items Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.75rem',
                      background: 'var(--color-surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'}
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                      }}
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'contain',
                        padding: '4px',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)'
                      }}
                    />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Qty: {item.quantity} &bull; Size: {item.size || 'UK 8'}
                      </p>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
