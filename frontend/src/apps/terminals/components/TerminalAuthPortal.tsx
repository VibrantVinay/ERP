'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTerminalAuth, PRESET_TERMINALS } from '../context/TerminalAuthContext';

export function TerminalAuthPortal() {
  const router = useRouter();
  const { session, unlockStation, quickUnlock, lockStation } = useTerminalAuth();
  const [selectedStationId, setSelectedStationId] = useState(PRESET_TERMINALS[0].id);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleKeypadPress = (val: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Please enter the 4-digit station PIN (Default: 1234)');
      return;
    }

    const ok = unlockStation(selectedStationId, pin);
    if (!ok) {
      setErrorMsg('Invalid Terminal PIN. Try default PIN: 1234');
      setPin('');
    } else {
      setErrorMsg('');
    }
  };

  const selectedStation = PRESET_TERMINALS.find((t) => t.id === selectedStationId) || PRESET_TERMINALS[0];

  // STATE A: Terminal Session is Active -> Show Terminal Launchpad
  if (session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          background: 'var(--bg)',
          color: 'var(--text)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            width: '100%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '2.5rem',
            boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.1))',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
                ● STATION AUTHORIZED & ACTIVE
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0.5rem 0 0.2rem 0', color: 'var(--text)' }}>
                {session.station.name}
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Station Code: <strong>{session.station.code}</strong> • {session.station.branchName}
              </div>
            </div>

            <button
              onClick={lockStation}
              style={{
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔒 Lock Terminal
            </button>
          </div>

          {/* Mode Switcher Cards */}
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.5px' }}>
              Select Operational Terminal Mode:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {/* Option 1: Self-Service Kiosk */}
              <Link
                href="/kiosk"
                style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>📱</span>
                  <span style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    TOUCH SCREEN
                  </span>
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Self-Service Ordering Kiosk
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Customer-facing ordering interface with live database menu, Dine-in/Takeaway modes, add-on customizations, and direct kitchen token dispatch.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                  Launch Kiosk Terminal →
                </div>
              </Link>

              {/* Option 2: Offers & Specials Board */}
              <Link
                href="/offers-board"
                style={{
                  background: 'var(--bg)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.8rem',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.5rem' }}>📺</span>
                  <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                    DIGITAL SIGNAGE
                  </span>
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  Specials & Offers Display Board
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Wall-mounted or counter TV display featuring rotating database specials, active coupons, chef highlights, live clock, and kitchen status.
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                  Launch Display Board →
                </div>
              </Link>
            </div>
          </div>

          {/* Footer Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Terminal Station Operating Securely</span>
            <Link href="/pos" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Return to Staff Management Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // STATE B: Terminal Locked -> Show Dedicated Terminal Authorization
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '480px',
          width: '100%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '2.25rem 2rem',
          boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.1))',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            🖥️
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            Customer Terminal Lock
          </h1>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Authorized restaurant hardware login for Self-Service Kiosks and Digital Menu Boards.
          </p>
        </div>

        {/* Station Selector */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
            Choose Terminal Hardware Station:
          </label>
          <select
            value={selectedStationId}
            onChange={(e) => {
              setSelectedStationId(e.target.value);
              setPin('');
              setErrorMsg('');
            }}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {PRESET_TERMINALS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* PIN Entry Display */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.4rem', textAlign: 'center' }}>
            Enter Station Security PIN (Default: 1234)
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              margin: '0.5rem 0',
            }}
          >
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = pin.length > idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: '44px',
                    height: '48px',
                    borderRadius: '8px',
                    border: '2px solid',
                    borderColor: hasDigit ? 'var(--primary)' : 'var(--border)',
                    background: 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    color: 'var(--text)',
                  }}
                >
                  {hasDigit ? '●' : ''}
                </div>
              );
            })}
          </div>

          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.3rem', fontWeight: 600 }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Tactile On-Screen Numeric Keypad */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            userSelect: 'none',
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              style={{
                padding: '0.85rem',
                fontSize: '1.25rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--text)',
                cursor: 'pointer',
              }}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '0.85rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            style={{
              padding: '0.85rem',
              fontSize: '1.25rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            style={{
              padding: '0.85rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            ⌫
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <button
            type="button"
            onClick={() => handleSubmit()}
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '0.85rem',
              fontWeight: 800,
              fontSize: '1rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            Unlock Station →
          </button>

          <button
            type="button"
            onClick={() => quickUnlock(selectedStationId)}
            style={{
              width: '100%',
              background: 'transparent',
              color: 'var(--primary)',
              border: '1px dashed var(--primary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ⚡ 1-Click Quick Unlock (PIN 1234)
          </button>
        </div>

        {/* Return link */}
        <div style={{ textAlign: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
          <Link href="/pos" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
            Back to Staff Management Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

