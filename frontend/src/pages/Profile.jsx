import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  UserRound, 
  MapPin, 
  Package, 
  Heart, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  UserCheck,
  Sparkles,
  Edit3,
  Check
} from 'lucide-react';
import { logout, reset, updateUserState } from '../store/authSlice';

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
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone_number || '');

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/auth/me', {
        name: profileName,
        phone_number: profilePhone
      }, config);
      dispatch(updateUserState({ name: data.name, phone_number: data.phone_number }));
      toast.success('Profile details updated successfully!');
      setIsEditingProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const startEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({
      recipient_name: addr.recipient_name,
      phone_number: addr.phone_number,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state,
      postal_code: addr.postal_code,
      is_default: addr.is_default
    });
    setShowAddForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingAddressId) {
        await axios.put(`/api/addresses/${editingAddressId}`, newAddress, config);
        toast.success('Address updated successfully');
      } else {
        await axios.post('/api/addresses', newAddress, config);
        toast.success('Address saved successfully');
      }
      setShowAddForm(false);
      setEditingAddressId(null);
      setNewAddress({ recipient_name: '', phone_number: '', street_address: '', city: '', state: '', postal_code: '', is_default: false });
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/addresses/${id}/default`, {}, config);
      toast.success('Default delivery address updated');
      fetchAddresses();
    } catch (e) {
      toast.error('Failed to set default address');
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
    <div className="container profile-page-container">
      
      {/* 1. MOBILE-ONLY COMPACT HEADER (Visible on Tablet & Mobile) */}
      <div className="profile-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="profile-avatar-mobile">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 800, margin: 0 }}>
              {user.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 4px 0' }}>
              {user.email}
            </p>
            <span className="badge badge-orange" style={{ fontSize: '0.68rem', padding: '0.2rem 0.55rem' }}>
              {user.role} member
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="profile-logout-btn-mobile"
          title="Sign Out"
        >
          <LogOut size={16} />
          <span>Exit</span>
        </button>
      </div>

      {/* 2. MOBILE-ONLY HORIZONTAL NAVIGATION PILLS */}
      <div className="profile-mobile-nav">
        <button
          onClick={() => setActiveTab('profile')}
          className={`profile-nav-pill ${activeTab === 'profile' ? 'active' : ''}`}
        >
          <UserRound size={16} />
          <span>Account Info</span>
        </button>

        <button
          onClick={() => setActiveTab('addresses')}
          className={`profile-nav-pill ${activeTab === 'addresses' ? 'active' : ''}`}
        >
          <MapPin size={16} />
          <span>Address Book ({addresses.length})</span>
        </button>

        <Link
          to="/orders"
          className="profile-nav-pill"
        >
          <Package size={16} />
          <span>Order History</span>
        </Link>

        <Link
          to="/wishlist"
          className="profile-nav-pill"
        >
          <Heart size={16} />
          <span>Wishlist</span>
        </Link>
      </div>

      {/* 3. MAIN DUAL-COLUMN LAYOUT (DESKTOP) & STACKED (MOBILE) */}
      <div className="profile-main-layout">
        
        {/* DESKTOP SIDEBAR NAVIGATION (Hidden on mobile) */}
        <aside className="profile-desktop-sidebar luxury-card">
          
          {/* User Avatar & Identity */}
          <div style={{ textAlign: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1.25rem' }}>
            <div className="profile-avatar-desktop">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 800, marginBottom: '0.25rem' }}>
              {user.name}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.65rem' }}>
              {user.email}
            </p>
            <span className="badge badge-orange">
              {user.role} account
            </span>
          </div>

          {/* Desktop Nav Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`profile-desktop-nav-link ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <UserRound size={18} />
              <span>Personal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`profile-desktop-nav-link ${activeTab === 'addresses' ? 'active' : ''}`}
            >
              <MapPin size={18} />
              <span>Address Book ({addresses.length})</span>
            </button>

            <Link
              to="/orders"
              className="profile-desktop-nav-link"
            >
              <Package size={18} />
              <span>Order History</span>
            </Link>

            <Link
              to="/wishlist"
              className="profile-desktop-nav-link"
            >
              <Heart size={18} />
              <span>Saved Wishlist</span>
            </Link>

            <button
              onClick={handleLogout}
              className="profile-desktop-logout-btn"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>

        </aside>

        {/* MAIN TAB CONTENT AREA */}
        <main className="profile-content-area">
          
          {/* TAB 1: PERSONAL DETAILS */}
          {activeTab === 'profile' && (
            <div className="luxury-card profile-content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>
                    Personal Profile Details
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Manage your account credentials and personal preferences.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={() => {
                      setProfileName(user?.name || '');
                      setProfilePhone(user?.phone_number || '');
                      setIsEditingProfile(!isEditingProfile);
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', gap: '0.35rem' }}
                  >
                    <Edit3 size={15} />
                    {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                  </button>
                  <span className="badge badge-orange">
                    <ShieldCheck size={14} /> Verified Member
                  </span>
                </div>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem', fontWeight: 700 }}>
                    Update Profile Details
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="input-control"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="input-control"
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '0.5rem 1.35rem', fontSize: '0.85rem' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-details-grid">
                  <div className="profile-detail-box">
                    <span className="profile-detail-label">Full Name</span>
                    <p className="profile-detail-value">{user.name}</p>
                  </div>

                  <div className="profile-detail-box">
                    <span className="profile-detail-label">Email Address</span>
                    <p className="profile-detail-value">{user.email}</p>
                  </div>

                  <div className="profile-detail-box">
                    <span className="profile-detail-label">Contact Phone</span>
                    <p className="profile-detail-value">{user.phone_number || "Not specified"}</p>
                  </div>

                  <div className="profile-detail-box">
                    <span className="profile-detail-label">Account Role</span>
                    <p className="profile-detail-value" style={{ color: 'var(--color-primary)', textTransform: 'capitalize' }}>
                      {user.role}
                    </p>
                  </div>
                </div>
              )}

              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    Explore Authenticated Footwear
                  </h4>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem' }}>
                    Access all 330+ silhouettes with guaranteed authentic dispatch.
                  </p>
                </div>
                <Link to="/#catalog" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                  Browse Collection
                </Link>
              </div>
            </div>
          )}

          {/* TAB 2: ADDRESS BOOK */}
          {activeTab === 'addresses' && (
            <div className="luxury-card profile-content-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 800 }}>
                    Saved Shipping Addresses
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Add or remove delivery destinations for quick 1-click checkout.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingAddressId(null);
                    setNewAddress({ recipient_name: '', phone_number: '', street_address: '', city: '', state: '', postal_code: '', is_default: false });
                    setShowAddForm(!showAddForm);
                  }} 
                  className="btn btn-primary" 
                  style={{ fontSize: '0.85rem', padding: '0.55rem 1.1rem' }}
                >
                  <Plus size={16} /> {showAddForm ? 'Close Form' : 'Add Address'}
                </button>
              </div>

              {/* Add / Edit Address Form */}
              {showAddForm && (
                <form onSubmit={handleSaveAddress} className="address-form-box">
                  <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1.25rem', fontWeight: 700 }}>
                    {editingAddressId ? 'Edit Delivery Address' : 'New Delivery Address'}
                  </h3>
                  
                  <div className="address-form-grid-2">
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        placeholder="Recipient Full Name"
                        value={newAddress.recipient_name}
                        onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                        className="input-control"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="Phone Number (10 digits)"
                        value={newAddress.phone_number}
                        onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                        className="input-control"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                      Street Address
                    </label>
                    <input
                      type="text"
                      placeholder="Street Address, Building, Landmark, Apartment"
                      value={newAddress.street_address}
                      onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                      className="input-control"
                      required
                    />
                  </div>

                  <div className="address-form-grid-3">
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="input-control"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        State
                      </label>
                      <input
                        type="text"
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="input-control"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Postal Code
                      </label>
                      <input
                        type="text"
                        placeholder="Postal Code"
                        value={newAddress.postal_code}
                        onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                        className="input-control"
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingAddressId(null);
                      }}
                      className="btn btn-outline"
                      style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      {editingAddressId ? 'Update Address' : 'Save Delivery Address'}
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              {addresses.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1.5rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)'
                }}>
                  <MapPin size={36} color="var(--color-primary)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
                  <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.05rem' }}>
                    No Saved Addresses Found
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                    Add your shipping address now so you can check out in seconds on new drop releases.
                  </p>
                  <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                    <Plus size={16} /> Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="profile-addresses-grid">
                  {addresses.map((a) => (
                    <div key={a.id} className="profile-address-card" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <MapPin size={16} color="var(--color-primary)" />
                          <h4 style={{ color: '#fff', fontSize: '0.98rem', fontWeight: 700 }}>
                            {a.recipient_name}
                          </h4>
                          {a.is_default && (
                            <span className="badge badge-orange" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            onClick={() => startEditAddress(a)}
                            className="profile-delete-address-btn"
                            title="Edit Address"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(a.id)} 
                            className="profile-delete-address-btn"
                            title="Delete address"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.55 }}>
                        {a.street_address}, {a.city}, {a.state} &bull; {a.postal_code}
                      </p>
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                          <Phone size={13} />
                          <span>{a.phone_number}</span>
                        </div>
                        {!a.is_default && (
                          <button
                            onClick={() => handleSetDefaultAddress(a.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-primary)',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.2rem 0.4rem'
                            }}
                          >
                            <Check size={13} /> Set Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

      </div>

      {/* COMPREHENSIVE RESPONSIVE STYLES (PC & MOBILE COMPATIBLE) */}
      <style>{`
        .profile-page-container {
          padding-top: 2.25rem;
          padding-bottom: 4.5rem;
        }

        .profile-main-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2rem;
          align-items: start;
        }

        .profile-avatar-desktop {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--color-primary-subtle);
          border: 2px solid var(--color-primary);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.9rem;
          font-weight: 800;
          margin: 0 auto 0.75rem auto;
          box-shadow: 0 0 20px var(--color-primary-glow);
        }

        .profile-avatar-mobile {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-primary-subtle);
          border: 2px solid var(--color-primary);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          font-weight: 800;
          flex-shrink: 0;
        }

        .profile-desktop-sidebar {
          padding: 1.5rem;
          border-radius: var(--radius-lg);
        }

        .profile-desktop-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-md);
          background: transparent;
          color: var(--color-text-secondary);
          border: none;
          font-weight: 500;
          font-size: 0.92rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          width: 100%;
        }

        .profile-desktop-nav-link:hover {
          background-color: var(--color-surface);
          color: #fff;
        }

        .profile-desktop-nav-link.active {
          background-color: var(--color-primary);
          color: #000;
          font-weight: 700;
        }

        .profile-desktop-logout-btn {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-md);
          color: var(--color-error);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.92rem;
          font-weight: 600;
          margin-top: 1rem;
          border-top: 1px solid var(--color-border);
          padding-top: 1rem;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
        }

        .profile-desktop-logout-btn:hover {
          background-color: var(--color-error-bg);
        }

        .profile-content-card {
          padding: 2.25rem;
        }

        .profile-details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .profile-detail-box {
          background: var(--color-surface);
          padding: 1.15rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }

        .profile-detail-label {
          font-size: 0.74rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 4px;
        }

        .profile-detail-value {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
          word-break: break-word;
        }

        .address-form-box {
          background: var(--color-surface);
          padding: 1.75rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          margin-bottom: 2rem;
        }

        .address-form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .address-form-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .profile-addresses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
          gap: 1.25rem;
        }

        .profile-address-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          transition: border-color 0.2s ease;
        }

        .profile-address-card:hover {
          border-color: rgba(255, 107, 26, 0.4);
        }

        .profile-delete-address-btn {
          background: none;
          border: none;
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-delete-address-btn:hover {
          color: var(--color-error);
        }

        /* MOBILE ELEMENTS INITIAL STATE (HIDDEN ON DESKTOP) */
        .profile-mobile-header {
          display: none;
        }
        .profile-mobile-nav {
          display: none;
        }

        /* RESPONSIVE BREAKPOINT: TABLET & MOBILE (< 860px) */
        @media (max-width: 860px) {
          .profile-page-container {
            padding-top: 1.25rem;
            padding-bottom: 5.5rem;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .profile-main-layout {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .profile-desktop-sidebar {
            display: none !important;
          }

          .profile-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.15rem;
            background: var(--color-card);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            margin-bottom: 1rem;
          }

          .profile-logout-btn-mobile {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.5rem 0.85rem;
            background: rgba(239, 68, 68, 0.12);
            color: var(--color-error);
            border: 1px solid rgba(239, 68, 68, 0.25);
            border-radius: var(--radius-md);
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
          }

          .profile-mobile-nav {
            display: flex;
            gap: 0.5rem;
            overflow-x: auto;
            padding-bottom: 0.6rem;
            margin-bottom: 1.25rem;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }

          .profile-mobile-nav::-webkit-scrollbar {
            display: none;
          }

          .profile-nav-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.55rem 1rem;
            border-radius: var(--radius-full);
            font-size: 0.82rem;
            font-weight: 600;
            white-space: nowrap;
            cursor: pointer;
            border: 1px solid var(--color-border);
            background-color: var(--color-card);
            color: var(--color-text-secondary);
            transition: all 0.2s ease;
            text-decoration: none;
            flex-shrink: 0;
          }

          .profile-nav-pill.active {
            background-color: var(--color-primary);
            color: #000;
            border-color: var(--color-primary);
            font-weight: 800;
            box-shadow: 0 4px 15px var(--color-primary-glow);
          }

          .profile-content-card {
            padding: 1.25rem !important;
            border-radius: var(--radius-lg);
          }

          .profile-details-grid {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }

          .address-form-box {
            padding: 1.15rem;
          }

          .address-form-grid-2 {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }

          .address-form-grid-3 {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }

          .input-control {
            font-size: 16px !important; /* Prevents auto-zoom on iOS safari */
          }
        }

        /* VERY SMALL MOBILE (< 420px) */
        @media (max-width: 420px) {
          .profile-page-container {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }

          .profile-mobile-header {
            padding: 0.85rem;
          }

          .profile-content-card {
            padding: 1rem !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Profile;
