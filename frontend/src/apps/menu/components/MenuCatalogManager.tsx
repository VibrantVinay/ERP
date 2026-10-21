'use client';

import React, { useState, useEffect } from 'react';
import { menuApi } from '../api';
import { MenuItem, MenuAvailability, CreateMenuItemDto } from '../types';

export function MenuCatalogManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // New Dish Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateMenuItemDto>({
    name: '',
    category: 'Mains',
    price: 350,
    description: '',
    allergens: [],
    availability: 'Available',
    taxRatePercent: 5.0,
  });

  const ALLERGEN_OPTIONS = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish'];

  const loadMenu = async () => {
    try {
      setLoading(true);
      const [itemsData, catData] = await Promise.all([
        menuApi.getItems({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
        }),
        menuApi.getCategories(),
      ]);
      setItems(itemsData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to load menu items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [selectedCategory]);

  const handleToggleAvailability = async (item: MenuItem) => {
    const nextAvailability: MenuAvailability =
      item.availability === 'Available' ? 'Sold out' : 'Available';
    try {
      const updated = await menuApi.updateAvailability(item.id, nextAvailability);
      setItems(prev => prev.map(i => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to toggle availability', err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.price <= 0) return;
    try {
      const created = await menuApi.createItem(formData);
      setItems(prev => [created, ...prev]);
      setModalOpen(false);
      setFormData({
        name: '',
        category: 'Mains',
        price: 350,
        description: '',
        allergens: [],
        availability: 'Available',
        taxRatePercent: 5.0,
      });
    } catch (err) {
      console.error('Failed to create dish', err);
    }
  };

  const filteredItems = items.filter(it => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = it.name.toLowerCase().includes(q);
      const matchDesc = (it.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Menu & Modifiers Catalog
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Item pricing, multi-level categories, allergen declarations & instant 86/Sold-Out toggle
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            + Add New Dish
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'var(--surface)', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: selectedCategory === 'all' ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: selectedCategory === 'all' ? 'var(--primary)' : 'var(--bg)',
              color: selectedCategory === 'all' ? '#fff' : 'var(--text-main)',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            All Items ({items.length})
          </button>
          {categories.map(cat => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  border: isSel ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSel ? 'var(--primary)' : 'var(--bg)',
                  color: isSel ? '#fff' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search dishes or ingredients..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            padding: '0.45rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            fontSize: '0.8rem',
            minWidth: '220px',
          }}
        />
      </div>

      {/* Dishes Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
          overflowY: 'auto',
          flex: 1,
          alignContent: 'start',
        }}
      >
        {loading && items.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading catalog...
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            No dishes matching your selection.
          </div>
        ) : (
          filteredItems.map(item => {
            const isAvailable = item.availability === 'Available';

            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  opacity: isAvailable ? 1 : 0.75,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{item.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {item.category}
                    </span>
                  </div>

                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>
                    ₹{item.price.toFixed(2)}
                  </span>
                </div>

                {item.description && (
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                    {item.description}
                  </p>
                )}

                {/* Allergens & Modifiers Badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'auto' }}>
                  {item.allergens.map(alg => (
                    <span
                      key={alg}
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ {alg}
                    </span>
                  ))}
                  {item.modifierGroups && item.modifierGroups.length > 0 && (
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: '#f3e8ff',
                        color: '#7e22ce',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      ⚡ {item.modifierGroups.length} Modifier Group{item.modifierGroups.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Availability Toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '0.6rem', marginTop: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: isAvailable ? '#059669' : '#dc2626',
                    }}
                  >
                    ● {item.availability}
                  </span>

                  <button
                    onClick={() => handleToggleAvailability(item)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: isAvailable ? '1px solid #fca5a5' : '1px solid #a7f3d0',
                      background: isAvailable ? '#fee2e2' : '#ecfdf5',
                      color: isAvailable ? '#b91c1c' : '#059669',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isAvailable ? '86 / Mark Sold Out' : 'Mark Available'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Dish Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <form
            onSubmit={handleCreateSubmit}
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: '460px',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Add New Menu Dish</h3>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Dish Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. Handmade Fettuccine Tartufo"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Selling Price (₹) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Culinary Description</label>
              <textarea
                rows={2}
                placeholder="Ingredients, cooking preparation..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Allergens</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                {ALLERGEN_OPTIONS.map(a => {
                  const isChecked = formData.allergens?.includes(a);
                  return (
                    <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const current = formData.allergens || [];
                          const next = isChecked ? current.filter(x => x !== a) : [...current, a];
                          setFormData({ ...formData, allergens: next });
                        }}
                      />
                      {a}
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Dish to Menu
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

