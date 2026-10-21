'use client';

import React, { useState, useEffect } from 'react';
import { recipesApi } from '../api';
import { Recipe, RecipeCostAnalysis, CreateRecipeDto } from '../types';

export function RecipeCostingWorkspace() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [analysis, setAnalysis] = useState<RecipeCostAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // New Recipe Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [dishName, setDishName] = useState<string>('');
  const [category, setCategory] = useState<string>('Mains');
  const [sellingPrice, setSellingPrice] = useState<number>(500);
  const [prepMinutes, setPrepMinutes] = useState<number>(15);
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: number; unit: string; costPerUnit: number }>>([
    { name: '', quantity: 100, unit: 'g', costPerUnit: 0.5 },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rcpData, anaData] = await Promise.all([
        recipesApi.getRecipes(),
        recipesApi.getCostAnalysis(),
      ]);
      setRecipes(rcpData);
      setAnalysis(anaData);
      if (rcpData.length > 0 && !expandedRecipeId) {
        setExpandedRecipeId(rcpData[0].id);
      }
    } catch (err) {
      console.error('Failed to load recipes data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddIngredientRow = () => {
    setIngredients(prev => [...prev, { name: '', quantity: 50, unit: 'g', costPerUnit: 0.25 }]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  };

  const handleIngredientChange = (idx: number, field: string, value: any) => {
    setIngredients(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validIngredients = ingredients.filter(i => i.name.trim() !== '');
    if (!dishName.trim() || validIngredients.length === 0 || sellingPrice <= 0) return;

    try {
      const created = await recipesApi.createRecipe({
        dishName,
        category,
        sellingPrice,
        preparationMinutes: prepMinutes,
        ingredients: validIngredients,
      });
      setRecipes(prev => [...prev, created]);
      setExpandedRecipeId(created.id);
      setModalOpen(false);
      const updatedAna = await recipesApi.getCostAnalysis();
      setAnalysis(updatedAna);
      // Reset
      setDishName('');
      setSellingPrice(500);
      setIngredients([{ name: '', quantity: 100, unit: 'g', costPerUnit: 0.5 }]);
    } catch (err) {
      console.error('Failed to create recipe', err);
    }
  };

  const getCostBadge = (pct: number) => {
    if (pct <= 28) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'OPTIMAL' };
    if (pct <= 35) return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'ACCEPTABLE' };
    return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5', label: 'HIGH COST' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            Recipes & Food Costing (BOM)
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Bill of materials, raw ingredient cost variance, target food cost % & gross margin analysis
          </p>
        </div>

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
          + New Recipe BOM
        </button>
      </div>

      {/* KPI Costing Banner */}
      {analysis && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Average Food Cost
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: analysis.averageFoodCostPercentage > 32 ? '#dc2626' : '#059669' }}>
                {analysis.averageFoodCostPercentage}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: &lt;30%</span>
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Highest Margin Dish
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
              {analysis.lowestCostDish}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Food Cost: {analysis.lowestCostPercentage}% · Margin: {(100 - analysis.lowestCostPercentage).toFixed(1)}%
            </span>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Highest Cost Dish
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#dc2626' }}>
              {analysis.highestCostDish}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Food Cost: {analysis.highestCostPercentage}% · Margin: {(100 - analysis.highestCostPercentage).toFixed(1)}%
            </span>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Standard Recipes
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {analysis.totalRecipesCount}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Formulated & Costed</span>
          </div>
        </div>
      )}

      {/* Recipes List & Ingredients Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem', overflowY: 'auto', flex: 1, alignContent: 'start' }}>
        {recipes.map(recipe => {
          const badge = getCostBadge(recipe.foodCostPercentage);
          const isExpanded = expandedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              style={{
                background: 'var(--surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{recipe.dishName}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {recipe.category} · Prep: {recipe.preparationMinutes}m · Yield: {recipe.yieldPortions} portion
                  </span>
                </div>

                <span
                  style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '20px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    background: badge.bg,
                    color: badge.text,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.label}
                </span>
              </div>

              {/* Cost & Margin Metrics */}
              <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Selling Price: <strong style={{ color: 'var(--text-main)' }}>₹{recipe.sellingPrice.toFixed(2)}</strong></span>
                  <span>Portion Cost: <strong style={{ color: 'var(--primary)' }}>₹{recipe.totalPortionCost.toFixed(2)}</strong></span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Food Cost: <strong>{recipe.foodCostPercentage}%</strong></span>
                    <span>Gross Margin: <strong>{recipe.grossMarginPercentage}%</strong></span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${Math.min(recipe.foodCostPercentage, 100)}%`, background: badge.text }} />
                    <div style={{ flex: 1, background: '#10b981' }} />
                  </div>
                </div>
              </div>

              {/* BOM Toggle Button */}
              <button
                onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                style={{
                  padding: '0.45rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {isExpanded ? '▲ Hide Bill of Materials' : `▼ View ${recipe.ingredients.length} Ingredients (BOM)`}
              </button>

              {/* Expanded BOM Ingredients Table */}
              {isExpanded && (
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    <span>Ingredient</span>
                    <span>Qty/Unit</span>
                    <span style={{ textAlign: 'right' }}>Cost</span>
                  </div>
                  {recipe.ingredients.map(ing => (
                    <div key={ing.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', fontSize: '0.8rem', padding: '0.2rem 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <span style={{ fontWeight: 600 }}>{ing.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ing.quantity} {ing.unit}</span>
                      <span style={{ textAlign: 'right', fontWeight: 700 }}>₹{ing.ingredientCost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Recipe Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <form
            onSubmit={handleCreateSubmit}
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: '520px',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Formulate New Recipe (BOM)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Dish Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Saffron Tagliolini"
                  value={dishName}
                  onChange={e => setDishName(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                >
                  <option value="Small plates">Small plates</option>
                  <option value="Mains">Mains</option>
                  <option value="Sides">Sides</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Drinks">Drinks</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Target Selling Price (₹) *</label>
                <input
                  required
                  type="number"
                  min={1}
                  value={sellingPrice}
                  onChange={e => setSellingPrice(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Prep Time (mins)</label>
                <input
                  type="number"
                  min={1}
                  value={prepMinutes}
                  onChange={e => setPrepMinutes(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}
                />
              </div>
            </div>

            {/* Ingredients Rows */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Bill of Materials (Raw Ingredients)</label>
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg)', border: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  + Add Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {ingredients.map((ing, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.35rem', alignItems: 'center' }}>
                    <input
                      placeholder="Ingredient name"
                      value={ing.name}
                      onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                      style={{ padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={e => handleIngredientChange(idx, 'quantity', Number(e.target.value))}
                      style={{ padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                    />
                    <input
                      placeholder="Unit"
                      value={ing.unit}
                      onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                      style={{ padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="₹/Unit"
                      value={ing.costPerUnit}
                      onChange={e => handleIngredientChange(idx, 'costPerUnit', Number(e.target.value))}
                      style={{ padding: '0.45rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
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
                Save Recipe BOM
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

