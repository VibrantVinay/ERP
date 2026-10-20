import { escapeHTML } from '../core/format.js';

export function modalMarkup({ title, fields, values = [], mode = 'create' }) {
  const controls = fields.map((field, index) => {
    const [key, label, type, required, options] = field;
    const value = values[index] ?? '';
    const control = type === 'select'
      ? `<select name="${escapeHTML(key)}" ${required?'required':''}>${(options || []).map(option => `<option ${option === value ? 'selected' : ''}>${escapeHTML(option)}</option>`).join('')}</select>`
      : `<input name="${escapeHTML(key)}" type="${escapeHTML(type || 'text')}" value="${escapeHTML(value)}" ${required?'required':''} ${type === 'number'?'min="0"':''} />`;
    return `<label class="form-field"><span>${escapeHTML(label)}${required?' <em>*</em>':''}</span>${control}</label>`;
  }).join('');
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-header"><div><div class="eyebrow">GELATO GRAND · ${mode === 'edit' ? 'UPDATE RECORD' : 'NEW RECORD'}</div><h2 id="modal-title">${escapeHTML(title)}</h2></div><button class="icon-button" data-action="close-modal" aria-label="Close">×</button></header><form id="record-form"><div class="form-grid">${controls}</div><footer class="modal-footer"><button type="button" class="button button-light" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">${mode === 'edit' ? 'Save changes' : 'Create record'}</button></footer></form></section></div>`;
}
