'use client';

import React, { useState, useEffect } from 'react';
import { menuApi } from '../api';
import { MenuItem } from '../types';

export function MenuWorkspace() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [category, setCategory] = useState<string>('All dishes');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await menuApi.getAll(category);
      setItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [category]);

  const handleToggleAvailability = async (id: string, current: string) => {
    const next = current === 'Available' ? 'Sold out' : 'Available';
    try {
      await menuApi.setAvailability(id, next as any);
      fetchItems();
    } catch (err: any) {
      alert(err.message || 'Failed to update item availability');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">MENU & KITCHEN · OFFERINGS</div>
          <h1>Menu & Modifiers</h1>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {['All dishes', 'Small plates', 'Mains', 'Sides', 'Desserts', 'Drinks'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`btn ${category === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <p>Loading dishes...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price (₹)</th>
                <th>Notes / Ingredients</th>
                <th>Allergens</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(dish => (
                <tr key={dish.id}>
                  <td><strong>{dish.name}</strong></td>
                  <td>{dish.category}</td>
                  <td>₹{dish.price}</td>
                  <td>{dish.note || '—'}</td>
                  <td>{dish.allergens && dish.allergens.length ? dish.allergens.join(', ') : 'None'}</td>
                  <td>
                    <span className={`badge ${dish.availability === 'Available' ? 'badge-success' : 'badge-danger'}`}>
                      {dish.availability}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleAvailability(dish.id, dish.availability)}
                      className="btn btn-outline"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      {dish.availability === 'Available' ? 'Mark Sold Out' : 'Mark Available'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

