import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Flame, Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { login, register, verifyOtp, reset } from '../store/authSlice';
import axios from 'axios';

const LoginRegister = () => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'otp', 'forgot'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
    otp_code: ''
  });
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { name, email, password, confirmPassword, phone_number, otp_code } = formData;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (user) {
      if (user.role === 'admin') {
        toast.info('Redirecting to dedicated Admin Portal...');
        window.location.href = 'http://localhost:3001';
      } else {
        navigate('/');
      }
    }
    dispatch(reset());
  }, [user, isError, message, navigate, dispatch]);

  useEffect(() => {
    let interval;
    if (mode === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [mode, otpTimer]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await dispatch(register({ name, email, password, phone_number }));
      if (!res.error) {
        toast.success('Registration code sent to your email!');
        setMode('otp');
        setOtpTimer(60);
        setCanResendOtp(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    const res = await dispatch(verifyOtp({ email, otp_code, purpose: 'registration' }));
    if (!res.error) {
      toast.success('Email verified successfully! Welcome to AURA KICKS.');
      navigate('/');
    }
  };

  const handleResendOtp = async () => {
    try {
      await axios.post('/api/auth/resend-otp', { email, purpose: 'registration' });
      toast.success('New verification code sent');
      setOtpTimer(60);
      setCanResendOtp(false);
    } catch (e) {
      toast.error('Failed to resend verification code');
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/auth/forgot-password', { email, purpose: 'password_reset' });
      toast.success('Password reset code sent to your email');
      setMode('reset-confirm');
    } catch (e) {
      toast.error('Failed to request password reset');
    }
  };

  const handleResetConfirmSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await axios.post('/api/auth/reset-password', {
        email,
        otp_code,
        new_password: password
      });
      toast.success('Password reset successfully! Please sign in.');
      setMode('login');
    } catch (e) {
      toast.error('Failed to reset password. Check code.');
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
      
      <div className="luxury-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '44px',
            height: '44px',
            backgroundColor: 'var(--color-primary)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            boxShadow: '0 0 25px var(--color-primary-glow)'
          }}>
            <Flame size={26} color="#000" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#fff', textTransform: 'uppercase' }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Create VIP Account'}
            {mode === 'otp' && 'Verify Email Address'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'reset-confirm' && 'Set New Password'}
          </h2>
          
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {mode === 'login' && 'Enter your credentials to access drops & orders'}
            {mode === 'register' && 'Join the exclusive footwear community'}
            {mode === 'otp' && `Enter the 6-digit code sent to ${email}`}
            {mode === 'forgot' && 'We will send a single-use verification code'}
            {mode === 'reset-confirm' && 'Enter the OTP and your new secure password'}
          </p>
        </div>

        {/* 1. LOGIN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="name@example.com"
                className="input-control"
                required
              />
            </div>

            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                className="input-control"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.25rem', padding: '0.9rem', fontSize: '1rem' }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. REGISTER MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Rahul Sharma"
                className="input-control"
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="name@example.com"
                className="input-control"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Min 6 characters"
                  className="input-control"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                  Confirm
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  placeholder="Re-type password"
                  className="input-control"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.9rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {(isLoading || isSubmitting) ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Continue with Email OTP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* 3. OTP VERIFICATION */}
        {mode === 'otp' && (
          <form onSubmit={handleVerifyOtpSubmit}>
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <input
                type="text"
                name="otp_code"
                maxLength={6}
                value={otp_code}
                onChange={onChange}
                placeholder="000000"
                className="input-control"
                style={{
                  textAlign: 'center',
                  fontSize: '1.8rem',
                  letterSpacing: '0.5em',
                  fontWeight: 800,
                  padding: '0.75rem'
                }}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp_code.length < 6}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem' }}
            >
              {isLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {canResendOtp ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Resend Code
                </button>
              ) : (
                <span>Resend code in {otpTimer}s</span>
              )}
            </div>
          </form>
        )}

        {/* 4. FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
                Enter Your Registered Email
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="name@example.com"
                className="input-control"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
              Send Reset Code
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginTop: '1rem', cursor: 'pointer' }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* 5. RESET CONFIRM */}
        {mode === 'reset-confirm' && (
          <form onSubmit={handleResetConfirmSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Verification Code
              </label>
              <input
                type="text"
                name="otp_code"
                value={otp_code}
                onChange={onChange}
                placeholder="6-digit OTP code"
                className="input-control"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={onChange}
                placeholder="Min 6 characters"
                className="input-control"
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={onChange}
                placeholder="Re-enter password"
                className="input-control"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem' }}>
              Update Password & Sign In
            </button>
          </form>
        )}

        {/* Mode Toggle Footer */}
        {mode === 'login' && (
          <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Don't have an account? </span>
            <button
              onClick={() => setMode('register')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Sign Up
            </button>
          </div>
        )}

        {mode === 'register' && (
          <div style={{ textAlign: 'center', marginTop: '1.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Already have an account? </span>
            <button
              onClick={() => setMode('login')}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Sign In
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default LoginRegister;
