import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import LoginRegister from './pages/LoginRegister';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

const AdminPortalRedirect = () => {
  useEffect(() => {
    window.location.href = 'http://localhost:3001';
  }, []);
  return (
    <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>AURA KICKS Admin Portal</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Admin operations run on the dedicated admin portal (Port 3001).
      </p>
      <a href="http://localhost:3001" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
        Open Admin Portal (Port 3001)
      </a>
    </div>
  );
};

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/admin" element={<AdminPortalRedirect />} />
          <Route path="/admin/login" element={<AdminPortalRedirect />} />
        </Routes>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

export default App;
