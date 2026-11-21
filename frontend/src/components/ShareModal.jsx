import React, { useState } from 'react';
import { Copy, Check, Share2, MessageCircle, Send, Globe, X } from 'lucide-react';
import { toast } from 'react-toastify';

const ShareModal = ({ isOpen, onClose, title = "AURA KICKS Footwear", url = window.location.href }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`, '_blank');
  };

  const shareViaTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.75rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Share2 size={20} color="var(--color-primary)" />
            Share Footwear
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Share this silhouette or collection with your crew:
        </p>

        {/* Social Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button 
            onClick={shareViaWhatsApp}
            className="btn btn-secondary"
            style={{ flexDirection: 'column', gap: '0.4rem', padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}
          >
            <MessageCircle size={22} color="#22C55E" />
            WhatsApp
          </button>

          <button 
            onClick={shareViaTwitter}
            className="btn btn-secondary"
            style={{ flexDirection: 'column', gap: '0.4rem', padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}
          >
            <Send size={22} color="#38BDF8" />
            Twitter / X
          </button>

          <button 
            onClick={handleCopy}
            className="btn btn-secondary"
            style={{ flexDirection: 'column', gap: '0.4rem', padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}
          >
            {copied ? <Check size={22} color="var(--color-primary)" /> : <Copy size={22} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
        </div>

        {/* Link Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            readOnly
            value={url}
            className="input-control"
            style={{ fontSize: '0.85rem', padding: '0.6rem 0.9rem' }}
          />
          <button onClick={handleCopy} className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
