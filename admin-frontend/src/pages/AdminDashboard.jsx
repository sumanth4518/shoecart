import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  TrendingUp,
  Boxes,
  Star,
  Image as ImageIcon,
  UploadCloud,
  Layers,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getProducts } from '../store/productSlice';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'products', 'orders', 'customers', 'inventory'
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');

  // Product Form state
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [imageActiveTab, setImageActiveTab] = useState('primary'); // 'primary', 'angles', 'add'
  const [newAngleFile, setNewAngleFile] = useState(null);
  const [newAngleIsPrimary, setNewAngleIsPrimary] = useState(false);
  const [isUploadingAngle, setIsUploadingAngle] = useState(false);
  const [productForm, setProductForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    category: 'Sneakers',
    brand: 'Nike',
    stock: 10,
    image: '',
    imageFile: null,
    images: [],
    targetImageId: null,
    imageAction: 'replace_primary' // 'replace_primary', 'replace_target', 'append'
  });

  const { user } = useSelector((state) => state.auth);
  const { products } = useSelector((state) => state.products);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast.error('Administrator authentication required');
      navigate('/login');
      return;
    }
    fetchAnalytics();
    fetchOrders();
    fetchCustomers();
    dispatch(getProducts());
  }, [user, navigate, dispatch]);

  const fetchAnalytics = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/admin/analytics', config);
      setAnalytics(data);
    } catch (e) {
      // Ignore
    }
  };

  const fetchOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/orders', config);
      setOrders(data);
    } catch (e) {
      // Ignore
    }
  };

  const fetchCustomers = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/admin/customers', config);
      setCustomers(data);
    } catch (e) {
      // Ignore
    }
  };

  const handleSetPrimaryImage = async (productId, imageId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/products/${productId}/images/${imageId}/primary`, {}, config);
      toast.success('Primary cover image updated');
      setProductForm(prev => ({
        ...prev,
        image: data.image,
        images: data.images || []
      }));
      dispatch(getProducts());
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to set primary image');
    }
  };

  const handleDeleteProductImage = async (productId, imageId) => {
    if (!window.confirm('Delete this image from product gallery?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.delete(`/api/products/${productId}/images/${imageId}`, config);
      toast.success('Image removed from gallery');
      setProductForm(prev => ({
        ...prev,
        image: data.image,
        images: data.images || [],
        targetImageId: prev.targetImageId === imageId ? null : prev.targetImageId
      }));
      dispatch(getProducts());
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to delete image');
    }
  };

  const handleUploadAdditionalImage = async (file, isPrimary = false) => {
    if (!file) {
      toast.error('Please select an image file to upload');
      return;
    }
    if (!productForm.id) {
      toast.error('Product must be selected/published first');
      return;
    }
    setIsUploadingAngle(true);
    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };
      const formData = new FormData();
      formData.append('image_file', file);
      formData.append('is_primary', isPrimary ? 'true' : 'false');
      const { data } = await axios.post(`/api/products/${productForm.id}/images`, formData, config);
      toast.success('New image angle added to product gallery');
      setProductForm(prev => ({
        ...prev,
        image: data.image,
        images: data.images || []
      }));
      setNewAngleFile(null);
      setImageActiveTab('angles'); // Navigate to see all angles immediately
      dispatch(getProducts());
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to upload new image');
    } finally {
      setIsUploadingAngle(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };

      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('price', Number(productForm.price));
      formData.append('category', productForm.category);
      formData.append('brand', productForm.brand);
      formData.append('stock', Number(productForm.stock));
      formData.append('description', productForm.description);

      if (productForm.imageFile) {
        formData.append('image_file', productForm.imageFile);
        if (productForm.targetImageId) {
          formData.append('target_image_id', productForm.targetImageId);
        }
        if (productForm.imageAction) {
          formData.append('image_action', productForm.imageAction === 'append' ? 'append' : 'replace');
        }
      } else if (productForm.image) {
        formData.append('image', productForm.image);
      }

      if (isEditing) {
        await axios.put(`/api/products/${productForm.id}`, formData, config);
        toast.success('Product and visual gallery updated successfully');
      } else {
        await axios.post('/api/products', formData, config);
        toast.success('New footwear silhouette added');
      }

      // Immediately reset form to make UI instantly responsive
      setProductForm({ 
        id: null, 
        name: '', 
        description: '', 
        price: '', 
        category: 'Sneakers', 
        brand: 'Nike', 
        stock: 10, 
        image: '', 
        imageFile: null,
        images: [],
        targetImageId: null,
        imageAction: 'replace_primary'
      });
      setIsEditing(false);

      // Concurrently re-fetch products and analytics in the background
      Promise.all([
        dispatch(getProducts()),
        fetchAnalytics()
      ]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setDeletingId(id);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/products/${id}`, config);
        toast.success('Product deleted');
        Promise.all([
          dispatch(getProducts()),
          fetchAnalytics()
        ]);
      } catch (e) {
        toast.error('Failed to delete product');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/orders/${id}`, { status }, config);
      toast.success(`Order #${id} updated to ${status}`);
      fetchOrders();
      fetchAnalytics();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const handleUpdateVariantStock = async (variantId, stock) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/admin/inventory/${variantId}?stock=${stock}`, {}, config);
      toast.success('Inventory updated');
      fetchAnalytics();
      dispatch(getProducts());
    } catch (e) {
      toast.error('Failed to update inventory');
    }
  };

  const handleToggleCustomer = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/admin/customers/${id}/toggle-status`, {}, config);
      toast.success('Customer status updated');
      fetchCustomers();
    } catch (e) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Dashboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="badge badge-orange" style={{ marginBottom: '0.4rem' }}>AURA Management Console</span>
          <h1 style={{ fontSize: '2rem', textTransform: 'uppercase', color: '#fff' }}>Store Administration</h1>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--color-surface)', padding: '0.4rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
          {[
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'inventory', label: 'Inventory', icon: Boxes },
            { id: 'customers', label: 'Customers', icon: Users }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#000' : 'var(--color-text-secondary)',
                  border: 'none',
                  fontWeight: active ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ANALYTICS VIEW */}
      {activeTab === 'analytics' && analytics && (
        <div>
          {/* KPI Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
            
            <div className="luxury-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Gross Revenue</span>
                <DollarSign size={20} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>
                ₹{Number(analytics.total_revenue).toLocaleString('en-IN')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '4px' }}>From recorded sales orders</p>
            </div>

            <div className="luxury-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Orders</span>
                <ShoppingBag size={20} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {analytics.total_orders}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {analytics.pending_orders} pending fulfillment
              </p>
            </div>

            <div className="luxury-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Active Footwear</span>
                <Package size={20} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
                {analytics.total_products}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Across 6 categories</p>
            </div>

            <div className="luxury-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Low-Stock Variants</span>
                <AlertTriangle size={20} color="var(--color-error)" />
              </div>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-error)' }}>
                {analytics.low_stock_products}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>≤ 5 units left</p>
            </div>

          </div>

          {/* Low Stock Urgent Table */}
          {analytics.low_stock_details && analytics.low_stock_details.length > 0 && (
            <div className="luxury-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertTriangle size={18} /> Urgent Inventory Restock Alerts
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Silhouette</th>
                      <th style={{ padding: '0.75rem' }}>SKU</th>
                      <th style={{ padding: '0.75rem' }}>Size</th>
                      <th style={{ padding: '0.75rem' }}>Current Stock</th>
                      <th style={{ padding: '0.75rem' }}>Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.low_stock_details.map((item) => (
                      <tr key={item.variant_id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>{item.product_name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>{item.sku}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>{item.size}</td>
                        <td style={{ padding: '0.75rem', color: item.stock === 0 ? 'var(--color-error)' : 'var(--color-warning)', fontWeight: 800 }}>
                          {item.stock} pairs left
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <button
                            onClick={() => handleUpdateVariantStock(item.variant_id, item.stock + 10)}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            +10 Units
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Orders Overview */}
          <div className="luxury-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '1rem' }}>Recent Order Submissions</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Order Ref</th>
                    <th style={{ padding: '0.75rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem' }}>Total</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent_orders?.map((o) => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>#{o.order_number || o.id}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{o.user_name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>₹{Number(o.total_price).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{o.status}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Add / Edit Form */}
          <div className="luxury-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem' }}>
              {isEditing ? 'Edit Footwear Silhouette' : 'Add New Silhouette'}
            </h3>

            <form onSubmit={handleProductSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Product Name
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Nike Air Max Pulse"
                  className="input-control"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Base Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="11495"
                    className="input-control"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Initial Stock per Size
                  </label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="input-control"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Category
                  </label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="input-control"
                  >
                    <option value="Sneakers">Sneakers</option>
                    <option value="Running Shoes">Running Shoes</option>
                    <option value="Sports & Training">Sports & Training</option>
                    <option value="Casual Shoes">Casual Shoes</option>
                    <option value="Premium Collections">Premium Collections</option>
                    <option value="Slides & Sandals">Slides & Sandals</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Brand
                  </label>
                  <select
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="input-control"
                  >
                    <option value="Nike">Nike</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Adidas">Adidas</option>
                    <option value="New Balance">New Balance</option>
                    <option value="Puma">Puma</option>
                  </select>
                </div>
              </div>

              {/* DEDICATED VISUAL ASSETS CONTROLS (PRIMARY IMAGE, SIDE ANGLES, ADD NEW IMAGE) */}
              <div style={{
                marginBottom: '1.25rem',
                padding: '1.2rem',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.88rem', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ImageIcon size={16} color="var(--color-primary)" />
                    Visual Assets & Angle Management
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                    Neon S3 SigV4 Storage
                  </span>
                </div>

                {/* 3 Explicit Navigation Options */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setImageActiveTab('primary')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: imageActiveTab === 'primary' ? 800 : 500,
                      background: imageActiveTab === 'primary' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: imageActiveTab === 'primary' ? '#000000' : 'var(--color-text-secondary)',
                      border: `1px solid ${imageActiveTab === 'primary' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Star size={13} fill={imageActiveTab === 'primary' ? '#000' : 'none'} />
                    Primary Image
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageActiveTab('angles')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: imageActiveTab === 'angles' ? 800 : 500,
                      background: imageActiveTab === 'angles' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: imageActiveTab === 'angles' ? '#000000' : 'var(--color-text-secondary)',
                      border: `1px solid ${imageActiveTab === 'angles' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Layers size={13} />
                    Side Angles ({productForm.images?.length || (productForm.image ? 1 : 0)})
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageActiveTab('add')}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: imageActiveTab === 'add' ? 800 : 500,
                      background: imageActiveTab === 'add' ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: imageActiveTab === 'add' ? '#000000' : 'var(--color-text-secondary)',
                      border: `1px solid ${imageActiveTab === 'add' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Plus size={14} />
                    Add New Image
                  </button>
                </div>

                {/* 1. PRIMARY IMAGE TAB: OPTIONS TO CHANGE PRIMARY */}
                {imageActiveTab === 'primary' && (
                  <div>
                    {/* Current Primary Preview */}
                    <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <img 
                        src={productForm.image || (productForm.images?.find(i => i.is_primary)?.image_url) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'} 
                        alt="Current Primary Cover"
                        style={{ width: '75px', height: '75px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #F59E0B', background: '#090909' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.62rem', background: '#F59E0B', color: '#000', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                            ⭐ ACTIVE PRIMARY COVER
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Front-facing hero silhouette shown in storefront search and catalogue.</p>
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Choose an option below to switch or upload a new primary cover:</span>
                      </div>
                    </div>

                    {/* Option A: Select from existing product angles */}
                    {isEditing && productForm.images && productForm.images.length > 1 && (
                      <div style={{ marginBottom: '1.2rem', padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                          Option A: Pick from Existing Product Angles to be Primary
                        </label>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '0.6rem' }}>
                          Click "Make Primary" on any existing side angle to immediately switch the cover:
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))', gap: '0.5rem' }}>
                          {productForm.images.map((img) => (
                            <div
                              key={img.id}
                              style={{
                                position: 'relative',
                                borderRadius: '6px',
                                border: img.is_primary ? '2px solid #F59E0B' : '1px solid var(--color-border)',
                                padding: '4px',
                                backgroundColor: 'var(--color-surface)',
                                textAlign: 'center'
                              }}
                            >
                              <img src={img.image_url} alt="Angle" style={{ width: '100%', height: '50px', objectFit: 'contain', borderRadius: '4px' }} />
                              {img.is_primary ? (
                                <span style={{ fontSize: '0.58rem', color: '#F59E0B', fontWeight: 800, display: 'block', marginTop: '2px' }}>Current Cover</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(productForm.id, img.id)}
                                  className="btn btn-outline"
                                  style={{ width: '100%', padding: '2px 4px', fontSize: '0.6rem', borderColor: '#F59E0B', color: '#F59E0B', marginTop: '3px' }}
                                >
                                  Make Primary
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Option B: Upload brand new replacement cover */}
                    <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                        Option B: Upload New Replacement Cover Image
                      </label>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        Select a new file from your device to replace the primary image upon saving:
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProductForm({ ...productForm, imageFile: e.target.files[0], imageAction: 'replace_primary', targetImageId: null })}
                        className="input-control"
                      />
                      {productForm.imageFile && productForm.imageAction === 'replace_primary' && (
                        <p style={{ fontSize: '0.74rem', color: '#22C55E', marginTop: '0.35rem', fontWeight: 600 }}>
                          ✓ Selected: {productForm.imageFile.name} (will be saved as Primary Cover)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SIDE ANGLES TAB: ALL IMAGES VISIBLE FOR THIS PRODUCT */}
                {imageActiveTab === 'angles' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <div>
                        <h4 style={{ fontSize: '0.86rem', color: '#fff', fontWeight: 700 }}>
                          All Visual Angles for this Silhouette ({productForm.images?.length || (productForm.image ? 1 : 0)})
                        </h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                          Side views, lateral profile, outsole, and detail angles are all visible here.
                        </p>
                      </div>
                    </div>

                    {productForm.images && productForm.images.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.85rem' }}>
                        {productForm.images.map((img, idx) => (
                          <div
                            key={img.id}
                            style={{
                              position: 'relative',
                              borderRadius: 'var(--radius-md)',
                              border: img.is_primary ? '2px solid #F59E0B' : '1px solid var(--color-border)',
                              padding: '8px',
                              backgroundColor: 'var(--color-surface)',
                              transition: 'all 0.2s',
                              boxShadow: img.is_primary ? '0 0 15px rgba(245, 158, 11, 0.25)' : 'none'
                            }}
                          >
                            <div style={{ position: 'relative', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#090909', borderRadius: '6px', marginBottom: '0.5rem' }}>
                              <img
                                src={img.image_url}
                                alt={`Angle ${idx + 1}`}
                                style={{ maxWidth: '100%', maxHeight: '85px', objectFit: 'contain' }}
                              />
                              <div style={{ position: 'absolute', top: '4px', left: '4px' }}>
                                {img.is_primary ? (
                                  <span style={{ fontSize: '0.58rem', background: '#F59E0B', color: '#000', fontWeight: 800, padding: '2px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                    <Star size={8} fill="#000" /> PRIMARY
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.58rem', background: 'rgba(0,0,0,0.7)', color: 'var(--color-text-secondary)', padding: '2px 5px', borderRadius: '4px' }}>
                                    ANGLE #{idx + 1}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {!img.is_primary && (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(productForm.id, img.id)}
                                  className="btn btn-outline"
                                  style={{ flex: 1, padding: '0.3rem', fontSize: '0.68rem', borderColor: '#F59E0B', color: '#F59E0B' }}
                                >
                                  Make Primary
                                </button>
                              )}
                              {productForm.images.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProductImage(productForm.id, img.id)}
                                  className="btn btn-outline"
                                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.68rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--color-error)' }}
                                  title="Delete Angle"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>No side angles uploaded yet.</p>
                        <button
                          type="button"
                          onClick={() => setImageActiveTab('add')}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                          + Add First Side Angle
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SEPARATE OPTION TO ADD NEW IMAGE */}
                {imageActiveTab === 'add' && (
                  <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                      <Plus size={18} color="var(--color-primary)" />
                      <div>
                        <h4 style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>Separate Option: Add New Angle or Perspective</h4>
                        <p style={{ fontSize: '0.73rem', color: 'var(--color-text-secondary)' }}>
                          Upload an additional angle (sole view, medial profile, or heel view) directly to this product.
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Select File to Upload (PNG, JPG, WEBP)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewAngleFile(e.target.files[0])}
                        className="input-control"
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <input
                        type="checkbox"
                        id="newAngleIsPrimary"
                        checked={newAngleIsPrimary}
                        onChange={(e) => setNewAngleIsPrimary(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <label htmlFor="newAngleIsPrimary" style={{ fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}>
                        Set as Primary Cover immediately upon upload
                      </label>
                    </div>

                    {isEditing ? (
                      <button
                        type="button"
                        disabled={!newAngleFile || isUploadingAngle}
                        onClick={() => handleUploadAdditionalImage(newAngleFile, newAngleIsPrimary)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          opacity: (!newAngleFile || isUploadingAngle) ? 0.6 : 1,
                          cursor: (!newAngleFile || isUploadingAngle) ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isUploadingAngle ? (
                          <>
                            <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span>Uploading to Neon S3...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={16} />
                            <span>Upload & Save Angle to Product Now</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        Save the product first; you can then upload and manage unlimited side angles in this tab.
                      </p>
                    )}
                  </div>
                )}

              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Product Story & Technical Specs
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Describe silhouette upper, midsole technology, fit..."
                  className="input-control"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTop: '2px solid #fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}
                    />
                    <span>{isEditing ? 'Updating Silhouette...' : 'Publishing Product...'}</span>
                  </>
                ) : (
                  isEditing ? 'Update Silhouette' : 'Publish Product'
                )}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProductForm({ 
                      id: null, 
                      name: '', 
                      description: '', 
                      price: '', 
                      category: 'Sneakers', 
                      brand: 'Nike', 
                      stock: 10, 
                      image: '', 
                      imageFile: null,
                      images: [],
                      targetImageId: null,
                      imageAction: 'replace_primary'
                    });
                  }}
                  className="btn btn-outline"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* Product Listing Table */}
          <div className="luxury-card" style={{ padding: '1.75rem', flex: '1 1 500px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem' }}>
              Published Footwear ({products.length})
            </h3>

            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    <th style={{ padding: '0.75rem' }}>Image</th>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Category</th>
                    <th style={{ padding: '0.75rem' }}>Price</th>
                    <th style={{ padding: '0.75rem' }}>Stock</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <img 
                          src={p.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'} 
                          alt={p.name} 
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                          }}
                          style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
                        />
                      </td>
                      <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.category}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>₹{Number(p.price).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem' }}>{p.stock}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setProductForm({
                                id: p.id,
                                name: p.name,
                                description: p.description,
                                price: p.price,
                                category: p.category,
                                brand: p.brand || 'Nike',
                                stock: p.stock,
                                image: p.image,
                                imageFile: null,
                                images: p.images || [],
                                targetImageId: null,
                                imageAction: 'replace_primary'
                              });
                              // Scroll up to form on mobile/desktop smoothly
                              window.scrollTo({ top: 120, behavior: 'smooth' });
                            }}
                            className="btn btn-outline"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deletingId === p.id}
                            className="btn btn-outline"
                            style={{ 
                              padding: '0.3rem 0.6rem', 
                              fontSize: '0.75rem', 
                              color: 'var(--color-error)', 
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                              opacity: deletingId === p.id ? 0.6 : 1,
                              cursor: deletingId === p.id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {deletingId === p.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="luxury-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem' }}>
            Customer Orders Fulfillment ({orders.length})
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Order #</th>
                  <th style={{ padding: '0.75rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem' }}>Total</th>
                  <th style={{ padding: '0.75rem' }}>Payment</th>
                  <th style={{ padding: '0.75rem' }}>Address</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <React.Fragment key={o.id}>
                    <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              padding: '2px 4px',
                              cursor: 'pointer',
                              color: 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Toggle order items"
                          >
                            {expandedOrderId === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span>#{o.order_number || o.id}</span>
                        </div>
                        {o.items && o.items.length > 0 && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px', marginLeft: '1.6rem' }}>
                            {o.items.length} {o.items.length === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <strong style={{ color: '#fff' }}>{o.user_name}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{o.user_email}</p>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>₹{Number(o.total_price).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {o.payment_method === 'stripe' ? (
                          <span className="badge" style={{
                            backgroundColor: o.payment_status === 'PAID' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                            color: o.payment_status === 'PAID' ? '#22c55e' : '#eab308',
                            border: `1px solid ${o.payment_status === 'PAID' ? '#22c55e' : '#eab308'}`,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {o.payment_status === 'PAID' ? 'Stripe (PAID)' : 'Stripe (PENDING)'}
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                            COD ({o.payment_status || 'Pending'})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', maxWidth: '240px', fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.address}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge" style={{ textTransform: 'capitalize', backgroundColor: o.status === 'delivered' ? 'var(--color-success-bg)' : 'var(--color-surface)', color: o.status === 'delivered' ? 'var(--color-success)' : '#fff' }}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="input-control"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: 'auto' }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                    {expandedOrderId === o.id && (
                      <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--color-border)' }}>
                        <td colSpan="7" style={{ padding: '1rem 1.5rem' }}>
                          <h5 style={{ fontSize: '0.82rem', color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.5px' }}>
                            Ordered Footwear Items
                          </h5>
                          {(!o.items || o.items.length === 0) ? (
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No item details recorded for this order.</p>
                          ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                              {o.items.map((item) => (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.5rem',
                                    background: 'var(--color-surface)',
                                    borderRadius: '6px',
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
                                      width: '48px',
                                      height: '48px',
                                      objectFit: 'contain',
                                      backgroundColor: 'var(--color-background)',
                                      borderRadius: '4px',
                                      padding: '2px'
                                    }}
                                  />
                                  <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {item.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                      Qty: {item.quantity} &bull; Size: {item.size || 'UK 8'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                                      ₹{Number(item.price * item.quantity).toLocaleString('en-IN')}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INVENTORY MANAGEMENT (Size-Specific Stock) */}
      {activeTab === 'inventory' && (
        <div className="luxury-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1rem' }}>
            Size-Specific Inventory Management
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
            Inspect and update stock availability per UK footwear size. Prevents overselling during order transactions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <img src={p.image} alt={p.name} style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem' }}>{p.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{p.brand} &bull; {p.category}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {p.variants?.map((v) => (
                    <div key={v.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'block' }}>{v.size}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{v.sku}</span>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                        <input
                          type="number"
                          defaultValue={v.stock}
                          id={`stock-input-${v.id}`}
                          style={{ width: '50px', padding: '0.2rem', textAlign: 'center', background: 'var(--color-surface)', color: '#fff', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                        />
                        <button
                          onClick={() => {
                            const val = document.getElementById(`stock-input-${v.id}`).value;
                            handleUpdateVariantStock(v.id, Number(val));
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. CUSTOMER MANAGEMENT */}
      {activeTab === 'customers' && (
        <div className="luxury-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '1.25rem' }}>
            Registered Customer Accounts ({customers.length})
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Orders Placed</th>
                  <th style={{ padding: '0.75rem' }}>Total Spent</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.email}</td>
                    <td style={{ padding: '0.75rem', color: '#fff', fontWeight: 700 }}>{c.order_count}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>₹{Number(c.total_spent).toLocaleString('en-IN')}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ backgroundColor: c.is_active ? 'var(--color-success-bg)' : 'var(--color-error-bg)', color: c.is_active ? 'var(--color-success)' : 'var(--color-error)' }}>
                        {c.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleToggleCustomer(c.id)}
                        className="btn btn-outline"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
