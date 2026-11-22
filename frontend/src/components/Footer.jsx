import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      marginTop: '4rem',
      padding: '3.5rem 0 2rem 0'
    }}>
      <div className="container">
        {/* Value Proposition Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2rem',
          paddingBottom: '3rem',
          borderBottom: '1px solid var(--color-border)',
          marginBottom: '3rem'
        }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={26} color="var(--color-primary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>100% Verified Authentic</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Multi-point digital verification</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={26} color="var(--color-primary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>Express Delivery</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Free shipping on orders over ₹1,500</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={26} color="var(--color-primary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>Hassle-Free Returns</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>7-day unworn exchange guarantee</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={26} color="var(--color-primary)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#fff' }}>Archival Drops</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Exclusive limited editions</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ width: '28px', height: '28px', backgroundColor: 'var(--color-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={18} color="#000" strokeWidth={2.5} />
              </div>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                AURA<span style={{ color: 'var(--color-primary)' }}>KICKS</span>
              </span>
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', maxWidth: '280px' }}>
              Engineered for movement. Built for individuality. The ultimate destination for luxury street footwear and high-performance silhouettes.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', marginBottom: '1.2rem' }}>Footwear Catalog</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <Link to="/?category=Sneakers">High-Heat Sneakers</Link>
              <Link to="/?category=Running+Shoes">Performance Running</Link>
              <Link to="/?category=Sports+%26+Training">Court & Training</Link>
              <Link to="/?category=Premium+Collections">Collaborative Drops</Link>
              <Link to="/?category=Slides+%26+Sandals">Recovery Slides</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', marginBottom: '1.2rem' }}>Customer Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              <Link to="/orders">Order Tracking</Link>
              <Link to="/cart">Shopping Bag</Link>
              <Link to="/wishlist">Saved Wishlist</Link>
              <Link to="/profile">My Account & Profile</Link>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '1.75rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--color-text-muted)'
        }}>
          <div>&copy; 2026 AURA KICKS Inc. All rights reserved. Precision Craftsmanship &bull; 100% Authentic Luxury Footwear.</div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
