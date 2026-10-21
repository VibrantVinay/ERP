'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { menuApi } from '@/apps/menu/api';
import { MenuItem } from '@/apps/menu/types';
import { loyaltyApi } from '@/apps/loyalty/api';
import { PromoCampaign } from '@/apps/loyalty/types';
import { useTerminalAuth } from '@/apps/terminals/context/TerminalAuthContext';

const DISH_IMAGE_MAP: Record<string, string> = {
  'Burrata Caprese Salad': 'https://images.unsplash.com/photo-1592417817098-8f3d69102a56?w=1000&auto=format&fit=crop&q=80',
  'Truffle Mushroom Risotto': 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=1000&auto=format&fit=crop&q=80',
  'Charred Wagyu Ribeye Steak': 'https://images.unsplash.com/photo-1558030006-450675393462?w=1000&auto=format&fit=crop&q=80',
  'Wood-Fired Margherita Pizza': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=1000&auto=format&fit=crop&q=80',
  'Hand-Rolled Fettuccine Alfredo': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=1000&auto=format&fit=crop&q=80',
  'Classic Italian Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=1000&auto=format&fit=crop&q=80',
  'Dark Chocolate Fondant': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=1000&auto=format&fit=crop&q=80',
  'Smoked Bourbon Old Fashioned': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1000&auto=format&fit=crop&q=80',
  'Signature Espresso Martini': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1000&auto=format&fit=crop&q=80',
  'Fresh Basil Limeade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=1000&auto=format&fit=crop&q=80',
  'Rift Signature Fried Chicken Bucket (8 Pcs)': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1000&auto=format&fit=crop&q=80',
  'Hot & Fiery Wings Box (12 Pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=1000&auto=format&fit=crop&q=80',
  'Ultimate Family Feast Box': 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=1000&auto=format&fit=crop&q=80',
  'Double Truffle Zinger Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&auto=format&fit=crop&q=80',
  'Smoky BBQ Bacon Smash Burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=1000&auto=format&fit=crop&q=80',
  'Crispy Peri-Peri Paneer Crunch Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&auto=format&fit=crop&q=80',
  'Truffle Parmesan Crinkle Cut Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1000&auto=format&fit=crop&q=80',
  'Cheesy Jalapeño Popcorn Chicken': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=1000&auto=format&fit=crop&q=80',
  'Lotus Biscoff Monster Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=1000&auto=format&fit=crop&q=80',
  'Belgian Dark Chocolate Overload Shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=1000&auto=format&fit=crop&q=80',
};

export function OffersBoardWorkspace() {
  const { session } = useTerminalAuth();
  const [dbItems, setDbItems] = useState<MenuItem[]>([]);
  const [campaigns, setCampaigns] = useState<PromoCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slideIntervalSec, setSlideIntervalSec] = useState(6);
  const [currentTime, setCurrentTime] = useState('');

  // Clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real database menu items and promo campaigns
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [items, activeCampaigns] = await Promise.all([
          menuApi.getItems(),
          loyaltyApi.getCampaigns(true),
        ]);
        setDbItems(items);
        setCampaigns(activeCampaigns);
      } catch (e) {
        console.error('Failed to load offers board data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Generate dynamic slides from actual seeded database items
  const slides = useMemo(() => {
    if (dbItems.length === 0) return [];

    // Highlight key seeded items
    const highlightNames = [
      'Charred Wagyu Ribeye Steak',
      'Truffle Mushroom Risotto',
      'Wood-Fired Margherita Pizza',
      'Classic Italian Tiramisu',
      'Rift Signature Fried Chicken Bucket (8 Pcs)',
      'Double Truffle Zinger Burger',
    ];

    const matching = dbItems.filter((i) => highlightNames.includes(i.name));
    const listToUse = matching.length > 0 ? matching : dbItems.slice(0, 6);

    return listToUse.map((item, idx) => {
      const image =
        DISH_IMAGE_MAP[item.name] ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&auto=format&fit=crop&q=80';

      const promo = campaigns[idx % Math.max(1, campaigns.length)];

      return {
        id: item.id,
        badge: `⭐ CHEF HIGHLIGHT · ${item.category.toUpperCase()}`,
        title: item.name,
        price: `₹${item.price.toLocaleString('en-IN')}`,
        description: item.description || 'Prepared fresh daily by our culinary team.',
        image,
        couponCode: promo ? promo.code : 'FLAT20',
        couponTitle: promo ? promo.title : '20% OFF on Orders above ₹499',
      };
    });
  }, [dbItems, campaigns]);

  // Auto-rotating slides
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, slideIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [isPaused, slideIntervalSec, slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentSlide = slides[currentSlideIndex] || slides[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Bar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 900,
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '1.2rem',
              letterSpacing: '1px',
            }}
          >
            RIFT
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>
              TODAY'S SPECIALS & PROMOTIONAL OFFERS
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {session ? session.station.name : 'Digital Signage Board · Indiranagar Flagship'}
            </div>
          </div>
        </div>

        {/* Live Clock & Kitchen Speed Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.4rem 0.9rem', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>Kitchen Service: Normal</span>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>(8-10m wait)</span>
          </div>

          <div
            style={{
              fontSize: '1.3rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              color: 'var(--primary)',
              background: 'var(--surface)',
              padding: '0.35rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            {currentTime}
          </div>

          <button
            onClick={toggleFullscreen}
            title="Toggle TV Fullscreen"
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            ⛶ Fullscreen
          </button>
        </div>
      </header>

      {/* Main Display Area */}
      {loading || !currentSlide ? (
        <div style={{ textAlign: 'center', padding: '6rem', color: 'var(--text-muted)' }}>
          Loading menu board specials...
        </div>
      ) : (
        <main style={{ display: 'flex', gap: '1.75rem', flex: 1, margin: '1.25rem 0', minHeight: '440px' }}>
          {/* Left: Giant Animated Spotlight Banner */}
          <div
            style={{
              flex: '1 1 65%',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-md)',
              background: `linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.85) 85%), url(${currentSlide.image}) center/cover no-repeat`,
            }}
          >
            {/* Top Badge */}
            <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
              <span
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  letterSpacing: '0.5px',
                }}
              >
                {currentSlide.badge}
              </span>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '780px', zIndex: 10 }}>
              <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, color: '#fff', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                {currentSlide.title}
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#e2e8f0', lineHeight: 1.4, margin: '0.6rem 0 1.25rem 0', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                {currentSlide.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24' }}>
                  {currentSlide.price}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0,0,0,0.7)', border: '2px dashed #fbbf24', padding: '0.45rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>APPLY CODE AT KIOSK:</span>
                  <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.15rem', fontFamily: 'monospace' }}>
                    {currentSlide.couponCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Slide Indicators on Bottom Right */}
            <div style={{ position: 'absolute', bottom: '24px', right: '24px', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlideIndex(idx)}
                  style={{
                    width: idx === currentSlideIndex ? '28px' : '10px',
                    height: '10px',
                    borderRadius: '999px',
                    border: 'none',
                    background: idx === currentSlideIndex ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: Active Promos & Kiosk Shortcut */}
          <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Active Promo Cards List from Database */}
            <div
              style={{
                background: 'var(--surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flex: 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  ⚡ ACTIVE PROMOTIONS & DEALS
                </div>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                  ● LIVE DEALS
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, overflowY: 'auto' }}>
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.75rem 0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        Min spend: ₹{c.minSpend} • Valid all day
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface)', border: '1px dashed var(--primary)', color: 'var(--primary)', fontWeight: 900, fontFamily: 'monospace', fontSize: '0.85rem', padding: '0.25rem 0.55rem', borderRadius: '4px' }}>
                      {c.code}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch Kiosk Shortcut Box */}
            <div
              style={{
                background: 'var(--surface)',
                border: '2px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  ORDER YOURSELF
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginTop: '0.2rem' }}>
                  Self-Order Touch Kiosk
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                  Step up to any available terminal.
                </div>
              </div>

              <Link
                href="/kiosk"
                style={{
                  background: 'var(--primary)',
                  color: '#fff',
                  padding: '0.65rem 1.2rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Open Kiosk →
              </Link>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Bar */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span>Rotation: {isPaused ? 'Paused ⏸' : `Every ${slideIntervalSec}s ⏵`}</span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            {isPaused ? 'Resume ⏵' : 'Pause ⏸'}
          </button>
          <select
            value={slideIntervalSec}
            onChange={(e) => setSlideIntervalSec(Number(e.target.value))}
            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}
          >
            <option value={4}>4s</option>
            <option value={6}>6s</option>
            <option value={10}>10s</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span>💳 All Payment Modes Accepted</span>
          <Link href="/terminals" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}>
            🔒 Terminal Station Portal
          </Link>
        </div>
      </footer>
    </div>
  );
}
