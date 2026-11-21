import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserRound, MapPin, Package, Heart, LogOut, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { logout, reset } from '../store/authSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('profile');
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    phone_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    is_default: false
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchAddresses();
    }
  }, [user, navigate]);

  const fetchAddresses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/addresses', config);
      setAddresses(data);
    } catch (e) {
      // Ignore
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/addresses', newAddress, config);
      toast.success('Address saved successfully');
      setShowAddForm(false);
      setNewAddress({ recipient_name: '', phone_number: '', street_address: '', city: '', state: '', postal_code: '', is_default: false });
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`/api/addresses/${id}`, config);
      toast.info('Address removed');
      fetchAddresses();
    } catch (e) {
      toast.error('Failed to remove address');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* SIDEBAR NAVIGATION */}
        <div className="luxury-card" style={{ padding: '1.5rem' }}>
          
          {/* User Avatar */}
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'var(--color-primary-subtle)',
              border: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: 800,
              margin: '0 auto 0.75rem auto'
            }}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{user.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.email}</p>
            <span className="badge badge-orange" style={{ marginTop: '0.5rem' }}>
              {user.role} account
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'profile' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'profile' ? '#000' : 'var(--color-text-secondary)',
                border: 'none',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <UserRound size={18} /> Account Info
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: activeTab === 'addresses' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'addresses' ? '#000' : 'var(--color-text-secondary)',
                border: 'none',
                fontWeight: activeTab === 'addresses' ? 700 : 500,
                textAlign: 'left',
                cursor: 'pointer'
              }}
            >
              <MapPin size={18} /> Address Book ({addresses.length})
            </button>

            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500
              }}
            >
              <Package size={18} /> Order History
            </Link>

            <Link
              to="/wishlist"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-secondary)',
                fontWeight: 500
              }}
            >
              <Heart size={18} /> Saved Wishlist
            </Link>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-error)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                marginTop: '1rem',
                borderTop: '1px solid var(--color-border)',
                paddingTop: '1rem'
              }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>

        </div>

        {/* MAIN CONTENT AREA */}
        <div>
          {activeTab === 'profile' && (
            <div className="luxury-card" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.5rem' }}>Personal Profile Details</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Full Name</span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{user.name}</p>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email Address</span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{user.email}</p>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contact Phone</span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginTop: '4px' }}>{user.phone_number || "Not specified"}</p>
                </div>

                <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Account Role</span>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginTop: '4px', textTransform: 'capitalize' }}>{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="luxury-card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', color: '#fff' }}>Saved Shipping Addresses</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                  <Plus size={16} /> Add Address
                </button>
              </div>

              {showAddForm && (
                <form onSubmit={handleAddAddress} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>New Delivery Address</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Recipient Full Name"
                      value={newAddress.recipient_name}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                      className="input-control"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newAddress.phone_number}
                      onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                      className="input-control"
                      required
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Street Address, Building, Landmark"
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    className="input-control"
                    style={{ marginBottom: '1rem' }}
                    required
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="input-control"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="input-control"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      className="input-control"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Save Address
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)' }}>No saved addresses. Add an address for seamless 1-click checkout.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {addresses.map((a) => (
                    <div key={a.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ color: '#fff', fontSize: '1rem' }}>{a.recipient_name}</h4>
                        <button onClick={() => handleDeleteAddress(a.id)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                        {a.street_address}, {a.city}, {a.state} - {a.postal_code}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.5rem' }}>
                        Phone: {a.phone_number}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
