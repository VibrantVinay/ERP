'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { DemoPersona, DEFAULT_DEMO_PERSONAS } from '../types';

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
  const [personas, setPersonas] = useState<DemoPersona[]>(DEFAULT_DEMO_PERSONAS);

  useEffect(() => {
    async function loadPersonas() {
      try {
        const list = await authApi.getDemoPersonas();
        if (list && list.length > 0) {
          setPersonas(list);
        }
      } catch (err) {
        // Fallback is already DEFAULT_DEMO_PERSONAS
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
              Sign in to your restaurant terminal
            </p>
          </div>

          {/* Quick Customer Terminal Launch (No login required) */}
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🖥️</span> Customer Terminal
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Self-Service Kiosk & Display (No login required)
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const termPersona = personas.find(p => p.role === 'customer_terminal') || DEFAULT_DEMO_PERSONAS.find(p => p.role === 'customer_terminal')!;
                handlePersonaClick(termPersona);
              }}
              style={{
                padding: '0.35rem 0.75rem',
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Open →
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <button
              type="button"
              onClick={() => { setActiveTab('password'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'password' ? 700 : 500,
                color: activeTab === 'password' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'password' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              Email & Password
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('pin'); setError(null); }}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                border: 'none',
                background: 'none',
                fontWeight: activeTab === 'pin' ? 700 : 500,
                color: activeTab === 'pin' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === 'pin' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              4-Digit Staff PIN
            </button>
          </div>

          {error && (
            <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', border: '1px solid #f87171', borderRadius: 'var(--radius-sm)', color: '#991b1b', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email & Password Form */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Terminal Location
                </label>
                <select
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.9rem', cursor: 'pointer' }}
                >
                  <option value="Panaji Main">Panaji Main (Goa)</option>
                  <option value="Anjuna Beach">Anjuna Beach (North)</option>
                  <option value="Colva South">Colva South</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
              >
                {loading ? 'Authenticating...' : 'Sign In to Terminal'}
              </button>
            </form>
          )}

          {/* 4-Digit PIN Touch Pad */}
          {activeTab === 'pin' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Enter your 4-digit staff passcode:
                </div>
                {/* 4 Dots / Numbers Display */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', margin: '0.75rem 0' }}>
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid var(--primary)',
                        background: pin.length > i ? 'var(--primary)' : 'transparent',
                        transition: 'background 0.15s ease',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Touch Keypad */}
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
                      cursor: 'pointer',
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
                    alert('Reset users requested (backend offline or already reset)');
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
            {personas.map(p => {
              const isTerminal = p.role === 'customer_terminal';
              return (
                <button
                  key={p.id}
                  onClick={() => handlePersonaClick(p)}
                  style={{
                    background: isTerminal ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255,255,255,0.08)',
                    border: isTerminal ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.75rem',
                    color: '#f7f5f0',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isTerminal ? '#0284c7' : 'var(--accent)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isTerminal ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = isTerminal ? '#38bdf8' : 'rgba(255,255,255,0.15)';
                  }}
                >
                  <strong style={{ textTransform: 'capitalize', color: isTerminal ? '#7dd3fc' : undefined }}>
                    {isTerminal ? '🖥️ Customer Terminal:' : `${p.role}:`}
                  </strong>
                  <span>{p.name}</span>
                  <small style={{ opacity: isTerminal ? 0.95 : 0.6, color: isTerminal ? '#38bdf8' : undefined, fontWeight: isTerminal ? 700 : undefined }}>
                    {isTerminal ? 'NO LOGIN REQUIRED' : `PIN: ${p.pin}`}
                  </small>
                </button>
              );
            })}
          </div>
        </div>
      </footer>
    </div>
  );
}
