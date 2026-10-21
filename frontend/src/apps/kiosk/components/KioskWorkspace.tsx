'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { menuApi } from '@/apps/menu/api';
import { MenuItem } from '@/apps/menu/types';
import { ordersApi } from '@/apps/orders/api';
import { loyaltyApi } from '@/apps/loyalty/api';
import { useTerminalAuth } from '@/apps/terminals/context/TerminalAuthContext';

// Dish image map using accurate, authentic culinary photography matching exact seeded dishes
const DISH_IMAGE_MAP: Record<string, string> = {
  'Burrata Caprese Salad': 'https://images.unsplash.com/photo-1592417817098-8f3d69102a56?w=600&auto=format&fit=crop&q=80',
  'Truffle Mushroom Risotto': 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80',
  'Charred Wagyu Ribeye Steak': 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
  'Wood-Fired Margherita Pizza': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80',
  'Hand-Rolled Fettuccine Alfredo': 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&auto=format&fit=crop&q=80',
  'Classic Italian Tiramisu': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80',
  'Dark Chocolate Fondant': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80',
  'Smoked Bourbon Old Fashioned': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80',
  'Signature Espresso Martini': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  'Fresh Basil Limeade': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
  'Rift Signature Fried Chicken Bucket (8 Pcs)': 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
  'Hot & Fiery Wings Box (12 Pcs)': 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80',
  'Ultimate Family Feast Box': 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=600&auto=format&fit=crop&q=80',
  'Double Truffle Zinger Burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
  'Smoky BBQ Bacon Smash Burger': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
  'Crispy Peri-Peri Paneer Crunch Burger': 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
  'Truffle Parmesan Crinkle Cut Fries': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
  'Cheesy Jalapeño Popcorn Chicken': 'https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80',
  'Lotus Biscoff Monster Shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80',
  'Belgian Dark Chocolate Overload Shake': 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80',
};

const CATEGORY_ICON_MAP: Record<string, string> = {
  'Combos & Buckets': '🍗',
  'Burgers & Wraps': '🍔',
  'Small plates': '🥗',
  'Mains': '🍝',
  'Desserts': '🍨',
  'Beverages': '🥤',
};

interface CartItem {
  cartId: string;
  item: MenuItem;
  quantity: number;
  modifierText: string;
  unitPrice: number;
  totalPrice: number;
}

export function KioskWorkspace() {
  const router = useRouter();
  const { session } = useTerminalAuth();

  const [dbItems, setDbItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [orderType, setOrderType] = useState<'Dine-in' | 'Takeaway' | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // Customizer state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { id: string; name: string; priceDelta: number }>>({});
  const [modalQty, setModalQty] = useState(1);

  // Promo code
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  // Checkout state
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Counter'>('UPI');
  const [orderCompletedToken, setOrderCompletedToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real items from backend database
  useEffect(() => {
    async function loadDbMenu() {
      try {
        setLoading(true);
        const items = await menuApi.getItems();
        setDbItems(items);
        const cats = Array.from(new Set(items.map((i) => i.category)));
        setCategories(cats);
        if (cats.length > 0) {
          setSelectedCategory(cats[0]);
        }
      } catch (e) {
        console.error('Failed to load menu from DB', e);
      } finally {
        setLoading(false);
      }
    }
    loadDbMenu();
  }, []);

  // Countdown timer on completion
  useEffect(() => {
    let timer: any;
    if (orderCompletedToken) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleResetKiosk();
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [orderCompletedToken]);

  const handleResetKiosk = () => {
    setOrderType(null);
    setCart([]);
    setAppliedCode(null);
    setCouponCode('');
    setDiscountAmount(0);
    setIsTrayOpen(false);
    setIsCheckingOut(false);
    setOrderCompletedToken(null);
    setCountdown(15);
  };

  const openCustomizer = (item: MenuItem) => {
    setCustomizingItem(item);
    setModalQty(1);
    const initialMods: Record<string, any> = {};
    if (item.modifierGroups) {
      item.modifierGroups.forEach((g) => {
        if (g.options.length > 0) {
          initialMods[g.id] = g.options[0];
        }
      });
    }
    setSelectedOptions(initialMods);
  };

  const handleAddCustomizedToCart = () => {
    if (!customizingItem) return;

    let deltaSum = 0;
    const modStrings: string[] = [];
    Object.values(selectedOptions).forEach((opt) => {
      deltaSum += opt.priceDelta || 0;
      modStrings.push(opt.name);
    });

    const unitPrice = customizingItem.price + deltaSum;
    const totalPrice = unitPrice * modalQty;

    const cartItem: CartItem = {
      cartId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      item: customizingItem,
      quantity: modalQty,
      modifierText: modStrings.join(', '),
      unitPrice,
      totalPrice,
    };

    setCart([...cart, cartItem]);
    setCustomizingItem(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.cartId === cartId) {
            const nextQty = ci.quantity + delta;
            if (nextQty <= 0) return null;
            return {
              ...ci,
              quantity: nextQty,
              totalPrice: ci.unitPrice * nextQty,
            };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.totalPrice, 0);
  }, [cart]);

  const gstAmount = useMemo(() => {
    return Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
  }, [subtotal, discountAmount]);

  const grandTotal = useMemo(() => {
    return Math.max(0, Math.round((subtotal - discountAmount + gstAmount) * 100) / 100);
  }, [subtotal, discountAmount, gstAmount]);

  const handleApplyCoupon = async (codeToTry?: string) => {
    const code = (codeToTry || couponCode).trim().toUpperCase();
    if (!code) return;

    try {
      const res = await loyaltyApi.validateCoupon({ code, orderTotal: subtotal });
      if (res.isValid) {
        setDiscountAmount(res.calculatedDiscount);
        setAppliedCode(code);
        setCouponCode(code);
      } else {
        alert(res.message || 'Invalid coupon code');
      }
    } catch {
      alert('Coupon validation failed. Try code "FLAT20" or "FEAST150"!');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const tokenNumber = `K-${Math.floor(100 + Math.random() * 900)}`;

      const orderPayload = {
        ticket: tokenNumber,
        type: (orderType === 'Dine-in' ? 'Dine-in' : 'Takeaway') as any,
        tableOrGuest: `Self-Service Kiosk · ${session?.station.code || 'KIOSK-01'}`,
        items: cart.map((ci) => ({
          id: ci.item.id,
          name: `${ci.item.name}${ci.modifierText ? ' (' + ci.modifierText + ')' : ''}`,
          quantity: ci.quantity,
          unitPrice: ci.unitPrice,
        })),
        subtotal,
        gstAmount,
        total: grandTotal,
        payment: (paymentMethod === 'Counter' ? 'Unpaid' : paymentMethod) as any,
        branchId: session?.station.branchId || 'branch-ind',
      };

      await ordersApi.createOrder(orderPayload);
      setOrderCompletedToken(tokenNumber);
      setIsCheckingOut(false);
      setIsTrayOpen(false);
    } catch {
      alert('Failed to place order. Please visit cashier counter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategoryItems = useMemo(() => {
    return dbItems.filter((item) => item.category === selectedCategory);
  }, [dbItems, selectedCategory]);

  // SCREEN 1: Welcome & Dine-In / Takeaway selection
  if (!orderType) {
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
          justifyContent: 'space-between',
          padding: '2.5rem 1.5rem',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif',
          userSelect: 'none',
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'var(--surface)', padding: '0.4rem 1.2rem', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.5px' }}>
            <span>⚡ {session ? session.station.name : 'Self-Ordering Kiosk Terminal'}</span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '1rem 0 0.5rem 0', color: 'var(--text)' }}>
            RIFT GASTRONOMY & EXPRESS
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>
            Freshly prepared artisan mains, gourmet smash burgers, stone pizzas & craft beverages.
          </p>
        </div>

        {/* Center: Dine-in vs Takeaway Cards */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '780px', width: '100%', margin: '2rem 0' }}>
          {/* Dine In */}
          <button
            onClick={() => setOrderType('Dine-in')}
            style={{
              flex: '1 1 320px',
              maxWidth: '360px',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0,0,0,0.1))',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🍽️</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              DINE IN
            </h2>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Enjoy your meal inside the bistro
            </div>
            <div style={{ marginTop: '1.5rem', background: 'var(--primary)', color: '#fff', fontWeight: 800, padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
              TOUCH TO ORDER →
            </div>
          </button>

          {/* Takeaway */}
          <button
            onClick={() => setOrderType('Takeaway')}
            style={{
              flex: '1 1 320px',
              maxWidth: '360px',
              background: 'var(--surface)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '2.5rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-md, 0 10px 30px rgba(0,0,0,0.1))',
              transition: 'transform 0.15s ease, border-color 0.15s ease',
            }}
          >
            <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🥡</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              TAKE AWAY
            </h2>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Carefully packaged to go
            </div>
            <div style={{ marginTop: '1.5rem', background: 'var(--primary)', color: '#fff', fontWeight: 800, padding: '0.6rem 1.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
              TOUCH TO ORDER →
            </div>
          </button>
        </div>

        {/* Bottom Banner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Link href="/terminals" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600 }}>
            🔒 Terminal Station Lock
          </Link>
          <span>•</span>
          <span>Touch Anywhere to Begin Order</span>
          <span>•</span>
          <Link href="/offers-board" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            View Specials Board
          </Link>
        </div>
      </div>
    );
  }

  // SCREEN 3: Order Completed / Token Screen
  if (orderCompletedToken) {
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
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            background: 'var(--surface)',
            border: '2px solid #10b981',
            borderRadius: 'var(--radius-md)',
            padding: '3rem 2.5rem',
            maxWidth: '560px',
            width: '100%',
            boxShadow: 'var(--shadow-md, 0 20px 40px rgba(0,0,0,0.1))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800 }}>
            ✓
          </div>

          <div style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#059669', fontWeight: 800 }}>
            Order Routed Directly to Kitchen
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            YOUR PICKUP TOKEN IS:
          </div>

          <div
            style={{
              fontSize: '4.5rem',
              fontWeight: 900,
              fontFamily: 'monospace',
              letterSpacing: '4px',
              color: 'var(--primary)',
              background: 'var(--bg)',
              padding: '0.6rem 2rem',
              borderRadius: 'var(--radius-sm)',
              border: '2px dashed var(--primary)',
            }}
          >
            {orderCompletedToken}
          </div>

          <p style={{ color: 'var(--text)', fontSize: '1rem', margin: 0, lineHeight: 1.5 }}>
            Please collect your receipt slip. Watch the overhead KDS display to collect your order when your token is ready.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span>⏱️ Estimated Preparation:</span>
            <span>8 - 12 Minutes</span>
          </div>

          <button
            onClick={handleResetKiosk}
            style={{
              width: '100%',
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 800,
              padding: '0.9rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            Start New Order (Auto resets in {countdown}s)
          </button>
        </div>
      </div>
    );
  }

  // SCREEN 2: Main Ordering Kiosk using EXACT DB ITEMS and Rift Theme
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.5rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', color: '#fff', fontWeight: 900, padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '1rem', letterSpacing: '0.5px' }}>
            RIFT
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
              Self-Ordering Kiosk
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {session ? session.station.name : 'Terminal #01 · Indiranagar Flagship'}
            </div>
          </div>
        </div>

        {/* Center: Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', padding: '0.35rem 0.85rem', borderRadius: '999px', border: '1px solid var(--border)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
          <span>{orderType === 'Dine-in' ? '🍽️ Dine In' : '🥡 Take Away'}</span>
          <button
            onClick={() => setOrderType(orderType === 'Dine-in' ? 'Takeaway' : 'Dine-in')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginLeft: '0.3rem' }}
          >
            Change
          </button>
        </div>

        {/* Right Buttons: Terminal Portal, Cancel, Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/terminals"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.8rem',
              textDecoration: 'none',
            }}
          >
            🔒 Terminals
          </Link>

          <button
            onClick={handleResetKiosk}
            style={{
              background: 'transparent',
              color: '#ef4444',
              border: '1px solid #fecaca',
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            ✕ Reset
          </button>

          <button
            onClick={() => setIsTrayOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              padding: '0.55rem 1.2rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <span>🛒 My Tray</span>
            <span style={{ background: '#fff', color: 'var(--primary)', borderRadius: '999px', padding: '0.1rem 0.45rem', fontSize: '0.8rem', fontWeight: 900 }}>
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
            <span>• ₹{grandTotal.toLocaleString('en-IN')}</span>
          </button>
        </div>
      </header>

      {/* Main Kiosk Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Categories Navigator */}
        <nav
          style={{
            width: '230px',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
            padding: '1rem 0.75rem',
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const icon = CATEGORY_ICON_MAP[cat] || '🍽️';
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.9rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                  background: isActive ? 'var(--primary)' : 'var(--bg)',
                  color: isActive ? '#fff' : 'var(--text)',
                  textAlign: 'left',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{icon}</span>
                <span style={{ flex: 1 }}>{cat}</span>
              </button>
            );
          })}
        </nav>

        {/* Center Food Items Grid (Exact DB Items) */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
              {selectedCategory}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {currentCategoryItems.length} items from kitchen catalog
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              Loading database menu items...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {currentCategoryItems.map((item) => {
                const imgUrl =
                  DISH_IMAGE_MAP[item.name] ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--surface)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {/* Dish Image */}
                    <div style={{ position: 'relative', height: '150px', width: '100%', background: 'var(--border)' }}>
                      <img
                        src={imgUrl}
                        alt={item.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      {item.allergens && item.allergens.length > 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                          }}
                        >
                          {item.allergens.join(', ')}
                        </span>
                      )}
                    </div>

                    {/* Card Details */}
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.4rem' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text)', lineHeight: 1.3 }}>
                        {item.name}
                      </h3>

                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4, flex: 1 }}>
                        {item.description || 'Crafted with premium ingredients in our central kitchen.'}
                      </p>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>
                          ₹{item.price.toLocaleString('en-IN')}
                        </div>

                        <button
                          onClick={() => openCustomizer(item)}
                          style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            padding: '0.45rem 0.9rem',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          ＋ Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Floating Tray Drawer */}
      {isTrayOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '100%',
              background: 'var(--surface)',
              borderLeft: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {/* Tray Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>
                  🛒 Your Order Tray ({orderType})
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {cart.length} distinct item(s) selected
                </div>
              </div>
              <button
                onClick={() => setIsTrayOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Tray Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🍽️</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>Your tray is empty</div>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>
                    Select dishes from the menu to add them to your meal.
                  </p>
                </div>
              ) : (
                cart.map((ci) => (
                  <div
                    key={ci.cartId}
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9rem' }}>
                        {ci.item.name}
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        ₹{ci.totalPrice.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {ci.modifierText && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Options: {ci.modifierText}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={() => updateQuantity(ci.cartId, -1)}
                          style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                          {ci.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(ci.cartId, 1)}
                          style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => updateQuantity(ci.cartId, -99)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Promo Code Input */}
              {cart.length > 0 && (
                <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
                    🎁 Special Coupon Code:
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. FLAT20 or FEAST150"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{ flex: 1, padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '0.85rem' }}
                    />
                    <button
                      onClick={() => handleApplyCoupon()}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      Apply
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {['FLAT20', 'FEAST150', 'COMBO99'].map((c) => (
                      <button
                        key={c}
                        onClick={() => handleApplyCoupon(c)}
                        style={{ background: 'var(--surface)', color: 'var(--primary)', border: '1px dashed var(--primary)', borderRadius: '4px', padding: '0.2rem 0.45rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ⚡ {c}
                      </button>
                    ))}
                  </div>

                  {appliedCode && (
                    <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.4rem', fontWeight: 600 }}>
                      ✓ Applied: {appliedCode} (-₹{discountAmount})
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tray Footer */}
            {cart.length > 0 && (
              <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>Items Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#10b981' }}>
                    <span>Discount Savings:</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <span>GST (5% Restaurant Tax):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', paddingTop: '0.4rem', borderTop: '1px dashed var(--border)' }}>
                  <span>Total Payable:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>

                <button
                  onClick={() => setIsCheckingOut(true)}
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                  }}
                >
                  Proceed to Payment →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Item Customizer Modal */}
      {customizingItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                  {customizingItem.name}
                </h3>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                  ₹{customizingItem.price.toLocaleString('en-IN')}
                </div>
              </div>
              <button
                onClick={() => setCustomizingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Modifier Groups from Database */}
            {customizingItem.modifierGroups && customizingItem.modifierGroups.length > 0 ? (
              customizingItem.modifierGroups.map((g) => (
                <div key={g.id}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '0.4rem' }}>
                    {g.name}:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {g.options.map((opt) => {
                      const isSelected = selectedOptions[g.id]?.id === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setSelectedOptions({ ...selectedOptions, [g.id]: opt })}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                            background: isSelected ? 'rgba(var(--primary-rgb, 194, 65, 12), 0.1)' : 'var(--bg)',
                            color: 'var(--text)',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{opt.name}</span>
                          {opt.priceDelta > 0 && <span>+₹{opt.priceDelta}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {customizingItem.description || 'Prepared fresh upon order submission.'}
              </div>
            )}

            {/* Quantity Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  -
                </button>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: '24px', textAlign: 'center' }}>
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty(modalQty + 1)}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddCustomizedToCart}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
              }}
            >
              Add To Tray
            </button>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckingOut && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                💳 Select Payment Method
              </h3>
              <button
                onClick={() => setIsCheckingOut(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: 'var(--bg)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount Due:</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)', marginTop: '0.2rem' }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Payment Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                onClick={() => setPaymentMethod('UPI')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid',
                  borderColor: paymentMethod === 'UPI' ? 'var(--primary)' : 'var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>📱</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant UPI QR Code</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan using GPay, PhonePe, Paytm</div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('Card')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid',
                  borderColor: paymentMethod === 'Card' ? 'var(--primary)' : 'var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>💳</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Credit / Debit Card Tap</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visa, Mastercard, RuPay reader</div>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('Counter')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '2px solid',
                  borderColor: paymentMethod === 'Counter' ? 'var(--primary)' : 'var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>💵</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Pay at Cashier Counter</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Take token slip and pay at checkout</div>
                </div>
              </button>
            </div>

            <button
              disabled={isSubmitting}
              onClick={handlePlaceOrder}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '0.9rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Submitting Order...' : 'Confirm & Print Order Token →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
