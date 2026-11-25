import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Star, 
  Zap,
  Lock,
  ShieldCheck
} from 'lucide-react';
import { getProducts } from '../store/productSlice';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { products, isLoading, isError, message } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(user && (user.token || user.access_token));

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialBrand = searchParams.get('brand') || '';
  const initialNewArrival = searchParams.get('is_new_arrival') === 'true';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory.toLowerCase() === 'running' ? 'Running Shoes' : initialCategory
  );
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedSize, setSelectedSize] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isNewArrival, setIsNewArrival] = useState(initialNewArrival);

  // Dynamically sync state with URL query parameters
  useEffect(() => {
    const cat = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');
    const newDrop = searchParams.get('is_new_arrival') === 'true';

    if (cat) {
      if (cat.toLowerCase() === 'running') {
        setSelectedCategory('Running Shoes');
      } else {
        setSelectedCategory(cat);
      }
      setIsNewArrival(false);
    } else if (newDrop) {
      setSelectedCategory('All');
      setIsNewArrival(true);
      setSortBy('newest');
    } else if (searchParams.has('category') && cat === 'All') {
      setSelectedCategory('All');
      setIsNewArrival(false);
    }

    if (brand !== null) {
      setSelectedBrand(brand);
    }
    if (search !== null) {
      setSearchTerm(search);
    }

    if (cat || brand || search || newDrop) {
      const el = document.getElementById('catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  // Query products on mount and whenever any filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(getProducts({
        search: searchTerm,
        category: selectedCategory === 'All' ? '' : selectedCategory,
        brand: selectedBrand,
        size: selectedSize,
        sort_by: sortBy,
        is_new_arrival: isNewArrival ? true : undefined
      }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedBrand, selectedSize, sortBy, isNewArrival, dispatch]);

  const categories = [
    'All',
    'Sneakers',
    'Running Shoes',
    'Sports & Training',
    'Casual Shoes',
    'Premium Collections',
    'Slides & Sandals'
  ];

  const brands = ['Nike', 'Jordan', 'Adidas', 'New Balance', 'Puma'];
  const sizes = ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'];

  return (
    <div>
      {/* 1. CINEMATIC HERO SECTION */}
      <section style={{
        position: 'relative',
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        background: 'radial-gradient(ellipse at 80% 40%, rgba(255, 107, 26, 0.12) 0%, rgba(9, 9, 9, 1) 70%)',
        borderBottom: '1px solid var(--color-border)',
        overflow: 'hidden',
        padding: '3rem 0'
      }}>
        {/* Ambient Grid Lines Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#262626 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          opacity: 0.35,
          pointerEvents: 'none'
        }} />

        <div className="container hero-grid">
          
          {/* Hero Copy */}
          <div className="hero-copy">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setIsNewArrival(true);
                    setSelectedCategory('All');
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="badge badge-orange"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', cursor: 'pointer', border: 'none', background: 'rgba(255, 107, 26, 0.15)', color: 'var(--color-primary)' }}
              >
                <Zap size={14} /> NEW DROP &bull; SS26 COLLECTION
              </button>
            </div>

            <h1 className="hero-heading" style={{
              fontSize: 'clamp(2.3rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
              color: '#FFFFFF'
            }}>
              STEP INTO <br />
              <span style={{
                background: 'linear-gradient(135deg, #FFFFFF 30%, var(--color-primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                YOUR NEXT ERA.
              </span>
            </h1>

            <p style={{
              fontSize: '1.1rem',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              maxWidth: '480px',
              marginBottom: '2rem'
            }}>
              Designed for explosive movement. Built for raw individuality. Explore handcrafted silhouettes and court-ready icons engineered for elite comfort.
            </p>

            <div className="hero-cta-group" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="btn btn-primary"
                style={{ padding: '0.9rem 2rem', fontSize: '1rem', cursor: 'pointer' }}
              >
                Shop Footwear
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login');
                  } else {
                    setSelectedCategory('Sneakers');
                    setIsNewArrival(false);
                    const el = document.getElementById('catalog');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="btn btn-outline"
                style={{ padding: '0.9rem 1.8rem', fontSize: '1rem', cursor: 'pointer' }}
              >
                Explore Sneakers
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="hero-metrics" style={{ display: 'flex', gap: '2.5rem', marginTop: '2.5rem', paddingTop: '1.75rem', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>100%</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Verified Authentic</p>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>24-48h</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Express Dispatch</p>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>7-Day</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Fit Guarantee</p>
              </div>
            </div>
          </div>

          {/* Hero Visual Presentation (Enhanced for Desktop & Mobile) */}
          <div className="hero-visual">
            <div className="hero-glow-circle" />

            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&q=85"
              alt="Nike Air Max Pulse Hero"
              className="hero-floating-sneaker"
            />

            {/* Floating Card Accent */}
            <div className="hero-floating-badge">
              <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Featured Silhouette
              </span>
              <h5 style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 700, margin: '2px 0' }}>
                Nike Air Max Pulse
              </h5>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                ₹11,495
              </span>
            </div>
          </div>

        </div>

        <style>{`
          .hero-grid {
            position: relative;
            z-index: 2;
            display: grid;
            grid-template-columns: 1.2fr 1fr;
            gap: 3.5rem;
            align-items: center;
          }
          .hero-visual {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 420px;
          }
          .hero-glow-circle {
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(255, 107, 26, 0.35) 0%, rgba(255, 107, 26, 0.08) 50%, rgba(9, 9, 9, 0) 70%);
            position: absolute;
            border-radius: 50%;
            z-index: 1;
            animation: glowPulse 5s ease-in-out infinite alternate;
          }
          .hero-floating-sneaker {
            position: relative;
            z-index: 2;
            width: 110%;
            max-width: 520px;
            height: auto;
            object-fit: contain;
            transform: rotate(-14deg) scale(1.05);
            filter: drop-shadow(0 35px 50px rgba(0, 0, 0, 0.95)) drop-shadow(0 10px 20px rgba(255, 107, 26, 0.2));
            animation: floatingSneaker 4s ease-in-out infinite;
          }
          .hero-floating-badge {
            position: absolute;
            bottom: 15px;
            right: 15px;
            z-index: 3;
            background-color: rgba(23, 23, 23, 0.88);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-md);
            padding: 0.9rem 1.25rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
          }
          @keyframes floatingSneaker {
            0%, 100% {
              transform: translateY(0px) rotate(-14deg) scale(1.05);
            }
            50% {
              transform: translateY(-16px) rotate(-10deg) scale(1.09);
            }
          }
          @keyframes glowPulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            100% { transform: scale(1.15); opacity: 1; }
          }

          /* RESPONSIVE & MOBILE ENHANCEMENTS */
          @media (max-width: 900px) {
            .hero-grid {
              grid-template-columns: 1fr;
              gap: 2.5rem;
              text-align: center;
            }
            .hero-copy {
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .hero-cta-group {
              justify-content: center;
              width: 100%;
            }
            .hero-metrics {
              justify-content: center;
              gap: 1.5rem;
              width: 100%;
            }
            .hero-visual {
              order: 2; /* Sits proudly between copy and brands */
              min-height: 340px;
              width: 100%;
              margin: 1.5rem 0 2rem;
            }
            .hero-glow-circle {
              width: 320px;
              height: 320px;
            }
            .hero-floating-sneaker {
              width: 95%;
              max-width: 400px;
              min-width: 280px;
              transform: rotate(-10deg) scale(1.12);
              animation: floatingSneakerMobile 3.5s ease-in-out infinite;
              filter: drop-shadow(0 25px 40px rgba(0, 0, 0, 0.95)) drop-shadow(0 10px 25px rgba(255, 107, 26, 0.3));
            }
            @keyframes floatingSneakerMobile {
              0%, 100% {
                transform: translateY(0px) rotate(-10deg) scale(1.12);
              }
              50% {
                transform: translateY(-14px) rotate(-6deg) scale(1.18);
              }
            }
            .hero-floating-badge {
              bottom: -15px;
              right: auto;
              left: 50%;
              transform: translateX(-50%);
              width: max-content;
              padding: 0.75rem 1.25rem;
            }
          }
        `}</style>
      </section>

      {/* 2. BRAND SPOTLIGHT BAR */}
      <section style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1.25rem 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            Featured Brands:
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => {
                  setSelectedBrand(selectedBrand === b ? '' : b);
                  const el = document.getElementById('catalog');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  background: selectedBrand === b ? 'var(--color-primary)' : 'var(--color-card)',
                  color: selectedBrand === b ? '#000' : 'var(--color-text-secondary)',
                  border: `1px solid ${selectedBrand === b ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  padding: '0.45rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: selectedBrand === b ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. FOOTWEAR CATALOGUE & FILTER BAR */}
      <section id="catalog" className="container" style={{ paddingTop: '3rem' }}>
        
        {/* AURA Standard Trust Pillars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          <div className="luxury-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255, 107, 26, 0.12)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 2px 0', fontWeight: 700 }}>100% Verified Authentic</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>Multi-point verification by sneaker specialists.</p>
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255, 107, 26, 0.12)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={22} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 2px 0', fontWeight: 700 }}>Express 24-48h Dispatch</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>Climate-controlled archive with real-time tracking.</p>
            </div>
          </div>

          <div className="luxury-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255, 107, 26, 0.12)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 2px 0', fontWeight: 700 }}>Precision Fit Guarantee</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>Live UK sizing with 7-day hassle-free exchange.</p>
            </div>
          </div>
        </div>

        {/* Search & Sorting Toolbar */}
        <div style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          marginBottom: '2rem'
        }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                
                {/* Search Input */}
                <div style={{ flex: '1 1 280px', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search by silhouette name, description, brand..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-control"
                    style={{ paddingLeft: '2.5rem', borderRadius: 'var(--radius-md)' }}
                  />
                  <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>

                {/* Sizing Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflowX: 'auto' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginRight: '4px' }}>Size:</span>
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        background: selectedSize === s ? 'var(--color-primary)' : 'var(--color-surface)',
                        color: selectedSize === s ? '#000' : 'var(--color-text-secondary)',
                        border: `1px solid ${selectedSize === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        fontWeight: selectedSize === s ? 800 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {/* Sort Select */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={16} color="var(--color-text-muted)" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-control"
                    style={{ width: 'auto', padding: '0.55rem 1rem', fontSize: '0.85rem' }}
                  >
                    <option value="newest">Sort: Newest Drops</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="name_asc">Alphabetical</option>
                  </select>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem', scrollbarWidth: 'none' }}>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setIsNewArrival(false);
                  }}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    background: (!isNewArrival && selectedCategory === 'All') ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: (!isNewArrival && selectedCategory === 'All') ? '#000000' : 'var(--color-text-secondary)',
                    border: `1px solid ${(!isNewArrival && selectedCategory === 'All') ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    fontWeight: (!isNewArrival && selectedCategory === 'All') ? 800 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setIsNewArrival(true);
                    setSelectedCategory('All');
                  }}
                  style={{
                    padding: '0.5rem 1.1rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.85rem',
                    background: isNewArrival ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isNewArrival ? '#000000' : 'var(--color-text-secondary)',
                    border: `1px solid ${isNewArrival ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    fontWeight: isNewArrival ? 800 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Zap size={14} fill={isNewArrival ? '#000' : 'var(--color-primary)'} color={isNewArrival ? '#000' : 'var(--color-primary)'} />
                  New Drops
                </button>
                {categories.filter(c => c !== 'All').map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setIsNewArrival(false);
                    }}
                    style={{
                      padding: '0.5rem 1.1rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      background: (!isNewArrival && selectedCategory === cat) ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: (!isNewArrival && selectedCategory === cat) ? '#000000' : 'var(--color-text-secondary)',
                      border: `1px solid ${(!isNewArrival && selectedCategory === cat) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      fontWeight: (!isNewArrival && selectedCategory === cat) ? 800 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', color: '#fff', textTransform: 'uppercase' }}>
                  {isNewArrival ? '⚡ New Drops & Exclusive Arrivals' : selectedCategory === 'All' ? 'Footwear Silhouettes' : selectedCategory}
                  {selectedBrand && ` • ${selectedBrand}`}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Showing {products.length} authenticated footwear models
                </p>
              </div>
              {isNewArrival && (
                <button
                  onClick={() => {
                    setIsNewArrival(false);
                    setSelectedCategory('All');
                    setSearchParams({});
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-full)',
                    color: 'var(--color-primary)',
                    padding: '0.4rem 0.9rem',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear New Drops Filter &times;
                </button>
              )}
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.25rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                  <Zap size={16} />
                  <span>Loading footwear catalogue & live sizing inventory...</span>
                </div>
                <div className="grid-catalog">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="skeleton" style={{ height: '360px', borderRadius: 'var(--radius-lg)' }} />
                  ))}
                </div>
              </div>
            ) : isError ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Cloud Server Waking Up</h4>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  Our cloud backend is spinning up from idle standby. Click below to refresh the catalogue and view all models.
                </p>
                <button
                  onClick={() => dispatch(getProducts({
                    search: searchTerm,
                    category: selectedCategory === 'All' ? '' : selectedCategory,
                    brand: selectedBrand,
                    size: selectedSize,
                    sort_by: sortBy,
                    is_new_arrival: isNewArrival ? true : undefined
                  }))}
                  className="btn btn-primary"
                >
                  Refresh Catalogue
                </button>
              </div>
            ) : products.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '5rem 1rem',
                backgroundColor: 'var(--color-card)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)'
              }}>
                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No silhouettes found</h3>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Try clearing filters or search queries.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('All');
                    setSelectedBrand('');
                    setSelectedSize('');
                  }}
                  className="btn btn-outline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid-catalog">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

      </section>

      {/* 4. REVIEWS & TESTIMONIALS */}
      <section style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', marginTop: '5rem', padding: '4rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="badge badge-orange" style={{ marginBottom: '0.75rem' }}>Community Voices</span>
            <h2 style={{ fontSize: '2rem', color: '#fff', textTransform: 'uppercase' }}>Verified Athlete & Collector Reviews</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                name: "Karan S.",
                shoe: "Nike Air Max Pulse",
                text: "The point-loaded heel unit is genuinely ridiculous. Perfect for all-day streetwear and responsive enough for brisk morning sprints.",
                rating: 5
              },
              {
                name: "Vikram R.",
                shoe: "Air Jordan 1 High OG",
                text: "Leather quality is exceptional right out of the box. Arrived in pristine condition within 36 hours. AURA KICKS authentication is legit.",
                rating: 5
              },
              {
                name: "Neha M.",
                shoe: "Adidas Ultraboost Light",
                text: "Best running shoes I've ever owned. Zero break-in period required and the black & orange accents look cinematic in person.",
                rating: 5
              }
            ].map((rev, idx) => (
              <div key={idx} className="luxury-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '0.75rem' }}>
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} size={16} color="var(--color-primary)" fill="var(--color-primary)" />
                  ))}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  "{rev.text}"
                </p>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{rev.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>{isAuthenticated ? rev.shoe : "Verified Member"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
