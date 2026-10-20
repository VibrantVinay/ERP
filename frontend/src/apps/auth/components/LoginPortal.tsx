'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { DemoPersona } from '../types';

export function LoginPortal() {
  const { loginWithPassword, loginWithPin, loginAsPersona } = useAuth();
  const [activeTab, setActiveTab] = useState<'password' | 'pin'>('password');

  // Form states
  const [email, setEmail] = useState('aarav@rift.example');
  const [password, setPassword] = useState('password123');
  const [pin, setPin] = useState('');
  const [branch, setBranch] = useState('Panaji Main');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [personas, setPersonas] = useState<DemoPersona[]>([]);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const list = await authApi.getDemoPersonas();
        setPersonas(list);
      } catch (err) {
        console.warn('Could not fetch demo personas list:', err);
      }
    }
    loadPersonas();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginWithPassword(email, password, branch);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await loginWithPin(pin, branch);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          loginWithPin(nextPin, branch).catch(err => {
            setError(err.message || 'Incorrect PIN.');
            setPin('');
          });
        }, 150);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handlePersonaClick = (p: DemoPersona) => {
    setError(null);
    loginAsPersona(p).catch(err => setError(err.message || 'Login failed'));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '2.25rem', boxShadow: 'var(--shadow-md)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>RIFT</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>
                OPERATIONS PORTAL
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Sign in to manage service, kitchen & floor operations
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--surface-alt)', padding: '0.3rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setError(null); }}
              className={`btn ${activeTab === 'password' ? 'btn-primary' : ''}`}
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('pin'); setError(null); }}
              className={`btn ${activeTab === 'pin' ? 'btn-primary' : ''}`}
              style={{ padding: '0.45rem', fontSize: '0.85rem' }}
            >
              ⚡ Staff Quick PIN
            </button>
          </div>

          {/* Branch Selector */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              RESTAURANT LOCATION
            </label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem' }}
            >
              <option value="Panaji Main">Panaji Main (Fontainhas)</option>
              <option value="Candolim Beach">Candolim Beach</option>
              <option value="Margao Town">Margao Town</option>
            </select>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #f87171', color: '#991b1b', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          {/* Tab 1: Email & Password */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@rift.example"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace →'}
              </button>
            </form>
          )}

          {/* Tab 2: Quick Staff PIN Pad */}
          {activeTab === 'pin' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ letterSpacing: '0.75rem', fontSize: '1.8rem', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  {pin.length > 0 ? '●'.repeat(pin.length) + '○'.repeat(4 - pin.length) : '○ ○ ○ ○'}
                </div>
                <small style={{ color: 'var(--text-muted)' }}>Enter 4-digit staff terminal passcode</small>
              </div>

              {/* Touch Numpad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxWidth: '280px', margin: '0 auto 1rem' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPin('');
                      else if (k === '⌫') handleBackspace();
                      else handleKeypadPress(k);
                    }}
                    style={{
                      height: '52px',
                      background: 'var(--surface-alt)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: 'var(--text)',
                      transition: 'background 0.1s',
                    }}
                    onMouseDown={e => (e.currentTarget.style.background = 'var(--accent-light)')}
                    onMouseUp={e => (e.currentTarget.style.background = 'var(--surface-alt)')}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Developer / Demo Persona Quick Switcher Bar */}
      <footer style={{ background: '#202f23', borderTop: '1px solid #324a37', padding: '1.25rem 2rem', color: '#f7f5f0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', color: '#9bb29d', textTransform: 'uppercase' }}>
              ⚡ 1-Click Role Switcher (Development & Testing)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#cad8c9' }}>Default password: <code>password123</code></span>
            <button
              onClick={async () => {
                if (confirm('Reset and clean users database to pristine default seed staff?')) {
                  try {
                    await authApi.cleanUsers();
                    alert('Users table cleaned and reset successfully!');
                    window.location.reload();
                  } catch (e: any) {
                    alert('Failed to clean users: ' + (e.message || e));
                  }
                }
              }}
              style={{
                fontSize: '0.75rem',
                color: '#fca5a5',
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.3)',
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              🧹 Reset Users DB
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {personas.map(p => (
              <button
                key={p.id}
                onClick={() => handlePersonaClick(p)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  color: '#f7f5f0',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.borderColor = 'transparent'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
              >
                <strong style={{ textTransform: 'capitalize' }}>{p.role}:</strong>
                <span>{p.name}</span>
                <small style={{ opacity: 0.6 }}>PIN: {p.pin}</small>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

