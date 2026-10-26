import React, { useState } from 'react';
import { dbService } from '../services/db';
import { ShieldCheck, Lock, User, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';

export function LoginPage({ onLoginSuccess }) {
  const company = dbService.getCompanyInfo();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await dbService.authenticateWithApi(username, password);
      if (res.success) onLoginSuccess(res.user);
      else setError(res.error || 'Authentication failed');
    } catch {
      setError('Unable to contact the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setError('');
  };

  const neoInset = 'inset 4px 4px 10px #c5d0da, inset -4px -4px 10px #ffffff';
  const neoRaised = '10px 10px 24px rgba(148,163,184,.45), -8px -8px 20px #ffffff';
  const inputBase = {
    width: '100%',
    padding: '12px 14px 12px 42px',
    fontSize: '14px',
    borderRadius: '14px',
    border: 'none',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#e8eef2',
    boxShadow: neoInset,
    color: '#0f172a',
    transition: 'box-shadow 0.2s'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 45%, #0f766e 100%)',
      fontFamily: "'Nunito', 'Segoe UI', sans-serif",
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#e8eef2',
        borderRadius: '22px',
        boxShadow: neoRaised,
        overflow: 'hidden'
      }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(145deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
          padding: '32px 24px',
          color: '#ffffff',
          textAlign: 'center',
          position: 'relative',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.15)'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(10px)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: 'inset 2px 2px 6px rgba(15,23,42,.2), inset -1px -1px 4px rgba(255,255,255,.35), 4px 4px 12px rgba(15,23,42,.2)'
          }}>
            <ShieldCheck size={36} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
            {company.name || 'Falcon Energy'}
          </h2>
          <p style={{ fontSize: '13px', margin: '4px 0 0 0', opacity: 0.9, fontWeight: '500' }}>
            {company.system_name || 'Transport Management System'}
          </p>
        </div>

        {/* Form Container */}
        <div style={{ padding: '32px 28px 28px 28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              Sign In to Your Account
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Enter your credentials to access system modules
            </p>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              background: '#ffe4e9',
              border: 'none',
              borderRadius: '14px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '20px',
              boxShadow: 'inset 2px 2px 6px rgba(190,18,60,.12), inset -2px -2px 6px rgba(255,255,255,.5)'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  style={inputBase}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{ ...inputBase, padding: '12px 42px 12px 42px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: '100%',
                padding: '13px',
                background: loading ? '#94a3b8' : 'linear-gradient(145deg, #14b8a6 0%, #0d9488 50%, #0f766e 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading
                  ? 'none'
                  : '5px 5px 14px rgba(13,148,136,.4), -2px -2px 8px rgba(255,255,255,.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <KeyRound size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
