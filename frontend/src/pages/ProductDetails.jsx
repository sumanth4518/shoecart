import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Heart, 
  ShoppingBag, 
  Share2, 
  Truck, 
  ShieldCheck, 
  RotateCcw, 
  Star, 
  ArrowLeft,
  Play,
  Check,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getProduct, clearProduct, getProducts } from '../store/productSlice';
import { addToCart } from '../store/cartSlice';
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice';
import ShareModal from '../components/ShareModal';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { product, products, isLoading, isError, message } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [reviewsData, setReviewsData] = useState({ reviews: [], average_rating: 5, total_reviews: 0 });
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.info('Please sign in to view silhouette details');
      navigate('/login');
      return;
    }
    dispatch(getProduct(id));
    dispatch(getProducts());
    fetchReviews();

    return () => {
      dispatch(clearProduct());
    };
  }, [id, user, dispatch, navigate]);

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      // Pick first in-stock variant by default
      const inStock = product.variants.find(v => v.stock > 0) || product.variants[0];
      setSelectedVariant(inStock);
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/product/${id}`);
      setReviewsData(data);
    } catch (e) {
      // Ignore
    }
  };

  const isWishlisted = wishlistItems?.some(item => item.id === Number(id));

  const handleWishlistToggle = () => {
    if (!user) {
      toast.info('Please sign in to save items to your wishlist');
      navigate('/login');
      return;
    }

    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      toast.info('Removed from wishlist');
    } else {
      dispatch(addToWishlist(product.id));
      toast.success('Added to wishlist');
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.info('Please sign in to add to cart');
      navigate('/login');
      return;
    }

    if (!selectedVariant || selectedVariant.stock <= 0) {
      toast.error('Selected size is out of stock');
      return;
    }

    dispatch(addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      size: selectedVariant.size,
      quantity
    }));
    toast.success(`Added ${product.name} (${selectedVariant.size}) to cart!`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to submit a review');
      navigate('/login');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('/api/reviews', {
        product_id: Number(id),
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment
      }, config);
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  if (isLoading || !product) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
          <div className="skeleton" style={{ height: '480px', borderRadius: 'var(--radius-lg)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton" style={{ height: '40px', width: '60%' }} />
            <div className="skeleton" style={{ height: '30px', width: '40%' }} />
            <div className="skeleton" style={{ height: '120px', width: '100%' }} />
            <div className="skeleton" style={{ height: '50px', width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <h3 style={{ color: 'var(--color-error)' }}>Error loading product</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{message}</p>
        <Link to="/" className="btn btn-outline">&larr; Back to Shop</Link>
      </div>
    );
  }

  const galleryImages = product.images && product.images.length > 0 
    ? product.images.map(img => img.image_url) 
    : [product.image];

  const currentDisplayImage = galleryImages[activeImageIndex] || product.image;
  const currentPrice = selectedVariant?.price || product.price || product.base_price;
  const originalPrice = product.base_price;
  const discountPercent = product.discount_percent || 0;
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

  const relatedProducts = products?.filter(p => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-text-secondary)' }}>
          <ArrowLeft size={16} /> Footwear
        </Link>
        <span>/</span>
        <span>{product.category}</span>
        <span>/</span>
        <span style={{ color: '#fff' }}>{product.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem' }}>
        
        {/* LEFT COLUMN: PRODUCT MEDIA GALLERY */}
        <div>
          {/* Main Stage Image */}
          <div style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 1.5rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '440px',
            overflow: 'hidden'
          }}>
            {/* Subtle background glow */}
            <div style={{
              position: 'absolute',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,26,0.18) 0%, rgba(9,9,9,0) 70%)',
              zIndex: 1
            }} />

            <img
              src={currentDisplayImage}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
              }}
              style={{
                maxHeight: '380px',
                maxWidth: '100%',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                filter: 'drop-shadow(0 25px 35px rgba(0,0,0,0.8))',
                transition: 'transform 0.3s ease'
              }}
            />

            {/* Badges on Gallery */}
            <div style={{ position: 'absolute', top: '1.25rem', left: '1.25rem', zIndex: 3 }}>
              {discountPercent > 0 && (
                <span className="badge badge-orange" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                  SAVE {discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${activeImageIndex === idx ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    backgroundColor: 'var(--color-card)',
                    padding: '0.4rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <img 
                    src={imgUrl} 
                    alt="Thumbnail" 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
                    }}
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                  />
                </button>
              ))}
            </div>
          )}

          {/* Video Showcase Player if available */}
          {product.videos && product.videos.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Play size={16} color="var(--color-primary)" /> Cinematic Motion Showcase
              </h4>
              <video
                src={product.videos[0].video_url}
                controls
                poster={product.videos[0].poster_url || currentDisplayImage}
                style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', backgroundColor: '#000' }}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & PURCHASE ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Brand & Category */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {product.brand || "AURA"}
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="btn-icon"
                title="Share this silhouette"
                style={{ width: '38px', height: '38px' }}
              >
                <Share2 size={18} />
              </button>

              <button
                onClick={handleWishlistToggle}
                className="btn-icon"
                title="Save to Wishlist"
                style={{
                  width: '38px',
                  height: '38px',
                  borderColor: isWishlisted ? 'var(--color-primary)' : 'var(--color-border)',
                  color: isWishlisted ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                <Heart size={18} fill={isWishlisted ? 'var(--color-primary)' : 'none'} />
              </button>
            </div>
          </div>

          {/* Product Name */}
          <h1 style={{ fontSize: '2.2rem', lineHeight: 1.15, fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
            {product.name}
          </h1>

          {/* Rating Snapshot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  color="var(--color-primary)"
                  fill={s <= Math.round(reviewsData.average_rating) ? 'var(--color-primary)' : 'none'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              {reviewsData.average_rating}
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              ({reviewsData.total_reviews} verified reviews)
            </span>
          </div>

          {/* Pricing Box */}
          <div style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'baseline',
            gap: '1rem'
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif", color: '#fff' }}>
              ₹{Number(currentPrice).toLocaleString('en-IN')}
            </span>
            {discountPercent > 0 && (
              <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                ₹{Number(originalPrice).toLocaleString('en-IN')}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: 600, marginLeft: 'auto' }}>
              Inclusive of all taxes
            </span>
          </div>

          {/* Size Selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                Select UK Size:
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                True to size fit
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.6rem' }}>
              {product.variants?.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const isOutOfStock = v.stock <= 0;

                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={isOutOfStock}
                    style={{
                      padding: '0.8rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-card)',
                      color: isSelected ? '#000000' : (isOutOfStock ? 'var(--color-text-muted)' : '#FFFFFF'),
                      border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.95rem',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      opacity: isOutOfStock ? 0.3 : 1,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{v.size}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 500, color: isSelected ? '#000' : 'var(--color-text-muted)' }}>
                      {isOutOfStock ? 'Sold Out' : `${v.stock} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Indicator Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: availableStock > 0 ? 'var(--color-success)' : 'var(--color-error)',
              boxShadow: availableStock > 0 ? '0 0 10px var(--color-success)' : 'none'
            }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: availableStock > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
              {availableStock > 0 ? `In Stock & Ready to Dispatch (${availableStock} pairs remaining)` : 'Temporarily Out of Stock'}
            </span>
          </div>

          {/* Quantity Stepper & Add to Cart Action */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.3rem'
            }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '38px', height: '38px', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                -
              </button>
              <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                disabled={quantity >= availableStock}
                style={{ width: '38px', height: '38px', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: quantity >= availableStock ? 'not-allowed' : 'pointer' }}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={availableStock <= 0}
              className="btn btn-primary"
              style={{ flex: 1, padding: '1rem', fontSize: '1.05rem', borderRadius: 'var(--radius-md)' }}
            >
              <ShoppingBag size={20} />
              Add to Bag &bull; ₹{(currentPrice * quantity).toLocaleString('en-IN')}
            </button>
          </div>

          {/* Description & Value Props */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '0.75rem' }}>Design & Engineering</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {product.description}
            </p>
          </div>

          {/* Guarantee Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '1rem', background: 'var(--color-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <Truck size={20} color="var(--color-primary)" style={{ margin: '0 auto 4px auto' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>Free Shipping</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <ShieldCheck size={20} color="var(--color-primary)" style={{ margin: '0 auto 4px auto' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>100% Authentic</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <RotateCcw size={20} color="var(--color-primary)" style={{ margin: '0 auto 4px auto' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>7-Day Returns</p>
            </div>
          </div>

        </div>
      </div>

      {/* REVIEWS SECTION */}
      <section style={{ marginTop: '5rem', borderTop: '1px solid var(--color-border)', paddingTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', textTransform: 'uppercase' }}>Customer Reviews</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Authentic feedback from verified purchasers</p>
          </div>

          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="btn btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            {showReviewForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>

        {/* Review Form Drawer */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="luxury-card" style={{ maxWidth: '600px', marginBottom: '2.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#fff' }}>Submit Verified Rating</h4>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Rating:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                >
                  <Star size={24} color="var(--color-primary)" fill={star <= newReview.rating ? 'var(--color-primary)' : 'none'} />
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Headline (e.g. Best comfort silhouette)"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              className="input-control"
              style={{ marginBottom: '1rem' }}
              required
            />

            <textarea
              rows={3}
              placeholder="Share details of fit, materials, sizing and daily wear..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="input-control"
              style={{ marginBottom: '1.25rem' }}
              required
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Review
            </button>
          </form>
        )}

        {/* Reviews List */}
        {reviewsData.reviews.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet. Be the first to leave your thoughts on this silhouette.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {reviewsData.reviews.map((r) => (
              <div key={r.id} className="luxury-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} size={15} color="var(--color-primary)" fill="var(--color-primary)" />
                    ))}
                  </div>
                  {r.is_verified_purchase && (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>
                <h5 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '0.4rem' }}>{r.title}</h5>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>{r.comment}</p>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>By {r.user_name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RELATED SNEAKERS */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section style={{ marginTop: '5rem', borderTop: '1px solid var(--color-border)', paddingTop: '3rem' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#fff', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            Recommended Silhouettes
          </h3>
          <div className="grid-catalog">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`Check out the ${product.name} on AURA KICKS`}
          url={window.location.href}
        />
      )}
    </div>
  );
};

export default ProductDetails;
