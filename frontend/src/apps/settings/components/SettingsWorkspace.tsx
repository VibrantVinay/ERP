'use client';

import React, { useState, useEffect } from 'react';
import { RestaurantSettings, TestPrinterResponse, TestWebhookResponse } from '../types';
import { settingsApi } from '../api';

type TabKey = 'identity' | 'hardware' | 'integrations';

export function SettingsWorkspace() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('identity');
  const [testPrintModal, setTestPrintModal] = useState<TestPrinterResponse | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testingHardware, setTestingHardware] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load system settings' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      const updated = await settingsApi.updateSettings(settings);
      setSettings(updated);
      showToast('System configuration & hardware settings saved successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async (printerType: 'kot' | 'receipt') => {
    try {
      setTestingHardware(printerType);
      const res = await settingsApi.testPrinter(printerType);
      setTestPrintModal(res);
      showToast(res.message);
    } catch (err: any) {
      showToast(err.message || 'Test print failed', 'error');
    } finally {
      setTestingHardware(null);
    }
  };

  const handleTestWebhook = async (aggregator: 'swiggy' | 'zomato') => {
    try {
      setTestingWebhook(aggregator);
      const res = await settingsApi.testWebhook(aggregator);
      showToast(`${res.message} (${res.pingLatencyMs}ms)`);
    } catch (err: any) {
      showToast(err.message || 'Webhook ping failed', 'error');
    } finally {
      setTestingWebhook(null);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading system configuration...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⚙️</span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              System Configuration & Hardware Integrations
            </h1>
          </div>
          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enterprise restaurant profile, thermal ESC/POS network hardware, tax rules, and third-party delivery webhooks.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.4rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <span>💾</span> {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.2rem',
            borderRadius: 'var(--radius-md)',
            background: notification.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: notification.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${notification.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            fontSize: '0.9rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <span>{notification.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.2rem',
        }}
      >
        <button
          onClick={() => setActiveTab('identity')}
          style={{
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'identity' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'identity' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🏢 Restaurant Profile & Tax
        </button>

        <button
          onClick={() => setActiveTab('hardware')}
          style={{
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'hardware' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'hardware' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🖨️ Thermal ESC/POS Hardware
        </button>

        <button
          onClick={() => setActiveTab('integrations')}
          style={{
            padding: '0.65rem 1.25rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'integrations' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'integrations' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🔌 Aggregators & Webhooks
        </button>
      </div>

      {/* Tab 1: Restaurant Identity & Tax */}
      {activeTab === 'identity' && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            🏢 Legal Entity & Brand Profile
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Brand Name</label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Tagline / Concept</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Registered Legal Entity</label>
              <input
                type="text"
                value={settings.legalEntity}
                onChange={(e) => setSettings({ ...settings, legalEntity: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>GSTIN Tax Number</label>
              <input
                type="text"
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>FSSAI Food License</label>
              <input
                type="text"
                value={settings.fssaiNumber}
                onChange={(e) => setSettings({ ...settings, fssaiNumber: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Standard Restaurant GST Rate (%)</label>
              <input
                type="number"
                step="0.5"
                value={settings.defaultGstRate}
                onChange={(e) => setSettings({ ...settings, defaultGstRate: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Currency Symbol</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>HQ Physical Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Central Customer Care Phone</label>
              <input
                type="text"
                value={settings.contactPhone}
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Official Inquiries Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Customer Receipt Footer Note</label>
            <input
              type="text"
              value={settings.receiptFooter}
              onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Thermal ESC/POS Hardware */}
      {activeTab === 'hardware' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* POS Receipt Printer Card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  🧾 Point of Sale (POS) Receipt Printer
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Direct ESC/POS socket connection for checkout bills and tax invoices.
                </p>
              </div>

              <button
                type="button"
                disabled={testingHardware === 'receipt'}
                onClick={() => handleTestPrint('receipt')}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primary)',
                  background: 'var(--surface)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: testingHardware === 'receipt' ? 'not-allowed' : 'pointer',
                }}
              >
                {testingHardware === 'receipt' ? 'Printing...' : '🖨️ Test Print Receipt'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Printer LAN IP Address</label>
                <input
                  type="text"
                  value={settings.receiptPrinterIp}
                  onChange={(e) => setSettings({ ...settings, receiptPrinterIp: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>RAW Port (Default: 9100)</label>
                <input
                  type="number"
                  value={settings.receiptPrinterPort}
                  onChange={(e) => setSettings({ ...settings, receiptPrinterPort: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Paper Roll Width</label>
                <select
                  value={settings.paperWidth}
                  onChange={(e) => setSettings({ ...settings, paperWidth: e.target.value as '80mm' | '58mm' })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                >
                  <option value="80mm">80mm (Standard Desktop)</option>
                  <option value="58mm">58mm (Compact Mobile)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Hardware Auto-Cutter</label>
                <select
                  value={settings.enableAutoCutter ? 'true' : 'false'}
                  onChange={(e) => setSettings({ ...settings, enableAutoCutter: e.target.value === 'true' })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                >
                  <option value="true">Enabled (Partial Cut)</option>
                  <option value="false">Disabled (Manual Tear)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Kitchen Order Ticket (KOT) Printer Card */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  ♨️ Kitchen Order Ticket (KOT) Printer
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Chef station thermal dispatcher with automated acoustic alert buzzer on print.
                </p>
              </div>

              <button
                type="button"
                disabled={testingHardware === 'kot'}
                onClick={() => handleTestPrint('kot')}
                style={{
                  padding: '0.55rem 1.1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #10b981',
                  background: 'var(--surface)',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: testingHardware === 'kot' ? 'not-allowed' : 'pointer',
                }}
              >
                {testingHardware === 'kot' ? 'Dispatching...' : '♨️ Test Dispatch KOT'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Kitchen Printer LAN IP</label>
                <input
                  type="text"
                  value={settings.kotPrinterIp}
                  onChange={(e) => setSettings({ ...settings, kotPrinterIp: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Port</label>
                <input
                  type="number"
                  value={settings.kotPrinterPort}
                  onChange={(e) => setSettings({ ...settings, kotPrinterPort: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.3rem' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Aggregators & Webhooks */}
      {activeTab === 'integrations' && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            🔌 Online Food Aggregators & Cloud Gateways
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Swiggy */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🧡</span>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>Swiggy Partner Order API</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Webhook endpoint: <code>https://api.rift-erp.internal/api/v1/delivery/webhooks/swiggy</code>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Shared Secret Key</label>
                  <input
                    type="password"
                    value={settings.swiggyWebhookSecret}
                    onChange={(e) => setSettings({ ...settings, swiggyWebhookSecret: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.2rem' }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={testingWebhook === 'swiggy'}
                onClick={() => handleTestWebhook('swiggy')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #f97316',
                  background: 'var(--surface)',
                  color: '#f97316',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: testingWebhook === 'swiggy' ? 'not-allowed' : 'pointer',
                }}
              >
                {testingWebhook === 'swiggy' ? 'Pinging...' : '⚡ Ping Swiggy Gateway'}
              </button>
            </div>

            {/* Zomato */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>❤️</span>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>Zomato Order Ingestion API</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Webhook endpoint: <code>https://api.rift-erp.internal/api/v1/delivery/webhooks/zomato</code>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Shared Secret Key</label>
                  <input
                    type="password"
                    value={settings.zomatoWebhookSecret}
                    onChange={(e) => setSettings({ ...settings, zomatoWebhookSecret: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.2rem' }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={testingWebhook === 'zomato'}
                onClick={() => handleTestWebhook('zomato')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #ef4444',
                  background: 'var(--surface)',
                  color: '#ef4444',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: testingWebhook === 'zomato' ? 'not-allowed' : 'pointer',
                }}
              >
                {testingWebhook === 'zomato' ? 'Pinging...' : '⚡ Ping Zomato Gateway'}
              </button>
            </div>

            {/* WhatsApp Business API */}
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>WhatsApp Business Notifications</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Used for guest booking confirmation, loyalty points updates, and e-bill dispatch.
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>API Token</label>
                  <input
                    type="password"
                    value={settings.whatsappApiKey}
                    onChange={(e) => setSettings({ ...settings, whatsappApiKey: e.target.value })}
                    style={{ width: '100%', padding: '0.45rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginTop: '0.2rem' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Thermal Print Slip Visualizer */}
      {testPrintModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              width: '100%',
              maxWidth: '420px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>
                🖨️ Simulated Thermal ESC/POS Output
              </div>
              <button
                onClick={() => setTestPrintModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#6b7280' }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
              ✓ {testPrintModal.message}
            </div>

            {/* Receipt Roll Simulation */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '1.25rem',
                borderRadius: '4px',
                fontFamily: 'Courier New, monospace',
                fontSize: '0.85rem',
                color: '#1e293b',
                whiteSpace: 'pre',
                lineHeight: 1.35,
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.04)',
                overflowX: 'auto',
              }}
            >
              {testPrintModal.payloadSample}
            </div>

            <button
              onClick={() => setTestPrintModal(null)}
              style={{
                padding: '0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

