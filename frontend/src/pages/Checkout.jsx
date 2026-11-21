import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  MapPin, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  ArrowRight,
  Plus,
  CreditCard
} from 'lucide-react';
import { fetchCart } from '../store/cartSlice';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [step, setStep] = useState(1); // 1: Delivery Details, 2: Review, 3: Confirmed
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartItems.length === 0 && !placedOrder) {
      navigate('/');
      return;
    }
    fetchSavedAddresses();
  }, [user, cartItems, navigate, placedOrder]);

  const fetchSavedAddresses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/addresses', config);
      setSavedAddresses(data);
      if (data.length > 0) {
        const defaultAddr = data.find(a => a.is_default) || data[0];
        setSelectedAddressId(defaultAddr.id);
        setAddress(`${defaultAddr.street_address}, ${defaultAddr.city}, ${defaultAddr.state} - ${defaultAddr.postal_code}`);
        setRecipientName(defaultAddr.recipient_name);
        setPhoneNumber(defaultAddr.phone_number);
      }
    } catch (e) {
      // Ignore
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 1500 ? 0 : 99;
  const totalAmount = subtotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error('Please enter or select a delivery address');
      return;
    }

    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const formattedAddress = `${recipientName} | ${phoneNumber} | ${address}`;

      // STRIPE CHECKOUT FLOW
      if (paymentMethod === 'stripe') {
        const checkoutPayload = {
          address: formattedAddress,
          orderItems: cartItems
        };
        const { data } = await axios.post('/api/payments/create-checkout-session', checkoutPayload, config);
        if (data.checkout_url) {
          toast.info('Redirecting to Stripe secure checkout...');
          window.location.href = data.checkout_url;
        } else {
          throw new Error('Stripe checkout session could not be established');
        }
        return;
      }

      // CASH ON DELIVERY (COD) FLOW
      const orderData = {
        orderItems: cartItems,
        address: formattedAddress,
        totalPrice: totalAmount,
        payment_method: paymentMethod
      };

      const { data } = await axios.post('/api/orders', orderData, config);
      setPlacedOrder(data);
      setStep(3); // Confirmed screen
      dispatch(fetchCart());
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: ORDER CONFIRMED VIEW
  if (step === 3 && placedOrder) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
        <div className="luxury-card" style={{ padding: '3rem 2rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--color-primary-subtle)',
            border: '2px solid var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto'
          }}>
            <CheckCircle2 size={40} color="var(--color-primary)" />
          </div>

          <span className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>Order Confirmed</span>
          <h1 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '0.5rem' }}>Thank You For Your Order!</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Order Reference: <strong style={{ color: '#fff' }}>#{placedOrder.orderNumber || placedOrder.orderId}</strong>
          </p>

          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            textAlign: 'left',
            marginBottom: '2rem',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Status:</span>
              <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>Pending Dispatch</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Payment Method:</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>Pay on Delivery (Cash/UPI)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Total Amount:</span>
              <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>₹{Number(placedOrder.totalAmount || totalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/orders" className="btn btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
              Track My Order
            </Link>
            <Link to="/" className="btn btn-outline" style={{ padding: '0.85rem 1.75rem' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      {/* Checkout Progress Stepper */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step >= 1 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 700 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 1 ? 'var(--color-primary)' : 'var(--color-surface)', color: step >= 1 ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
            1
          </span>
          Shipping
        </div>

        <div style={{ width: '40px', height: '1px', background: 'var(--color-border)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: step >= 2 ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 700 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: step >= 2 ? 'var(--color-primary)' : 'var(--color-surface)', color: step >= 2 ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
            2
          </span>
          Review & Pay
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: FORM */}
        <div className="luxury-card" style={{ padding: '2rem' }}>
          
          <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={22} color="var(--color-primary)" /> Delivery Information
          </h2>

          <form onSubmit={handlePlaceOrder}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="input-control"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Complete Shipping Address
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Flat / Building, Street, Landmark, City, State, PIN Code"
                className="input-control"
                required
              />
            </div>

            {/* Payment Method Selector */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.75rem' }}>Select Payment Method</h3>
              
              {/* Option 1: Stripe Test Gateway */}
              <div
                onClick={() => setPaymentMethod('stripe')}
                style={{
                  backgroundColor: paymentMethod === 'stripe' ? 'rgba(255, 115, 0, 0.08)' : 'var(--color-surface)',
                  border: `1px solid ${paymentMethod === 'stripe' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: 'pointer',
                  marginBottom: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'stripe'}
                  onChange={() => setPaymentMethod('stripe')}
                  style={{ accentColor: 'var(--color-primary)', transform: 'scale(1.2)', marginTop: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '0.98rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      <CreditCard size={18} color="var(--color-primary)" />
                      Stripe Card Payment
                    </h4>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#262626', color: '#ddd', fontWeight: 700 }}>VISA</span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: '#262626', color: '#ddd', fontWeight: 700 }}>MASTERCARD</span>
                      <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 115, 0, 0.2)', color: 'var(--color-primary)', fontWeight: 700 }}>TEST MODE</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Instant authorized checkout with Stripe test cards (e.g. <code>4242 4242...</code>). Hosted and 256-bit encrypted.
                  </p>
                </div>
              </div>

              {/* Option 2: Cash / UPI on Delivery */}
              <div
                onClick={() => setPaymentMethod('cod')}
                style={{
                  backgroundColor: paymentMethod === 'cod' ? 'rgba(255, 115, 0, 0.08)' : 'var(--color-surface)',
                  border: `1px solid ${paymentMethod === 'cod' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  style={{ accentColor: 'var(--color-primary)', transform: 'scale(1.2)', marginTop: '4px' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.98rem', color: '#fff', marginBottom: '0.25rem' }}>Pay on Delivery (Cash / UPI at Doorstep)</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', margin: 0 }}>
                    Inspect your footwear on arrival. Pay conveniently via UPI QR or Cash.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(0,0,0,0.2)',
                      borderTopColor: '#000',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite'
                    }}
                  />
                  {paymentMethod === 'stripe' ? 'Connecting to Stripe...' : 'Placing Order...'}
                </>
              ) : (
                paymentMethod === 'stripe'
                  ? `Pay Now with Stripe &bull; ₹${totalAmount.toLocaleString('en-IN')}`
                  : `Confirm & Place Order &bull; ₹${totalAmount.toLocaleString('en-IN')}`
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <div className="luxury-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
            Review Items ({cartItems.length})
          </h3>

          <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {cartItems.map((item) => (
              <div key={`${item.product_id}-${item.variant_id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <img
                  src={item.image}
                  alt={item.name}
                  style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'contain', backgroundColor: 'var(--color-surface)', padding: '4px' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Qty: {item.quantity} &bull; Size: {item.size}
                  </span>
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              <span>Items Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              <span>Shipping Fee</span>
              {deliveryFee === 0 ? (
                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>FREE</span>
              ) : (
                <span>₹{deliveryFee}</span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem', fontWeight: 800, fontSize: '1.3rem', color: 'var(--color-primary)' }}>
              <span>Total Pay:</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
