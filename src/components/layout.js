import { navigation } from '../data/modules.js';
import { escapeHTML, initials } from '../core/format.js';
import { displayToday } from '../core/dates.js';

export function renderLayout(path, content, apiOnline = false) {
  return `<div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="/dashboard" data-route="/dashboard"><span class="brand-mark">✿</span><span><b>gelato house</b><small>HOSPITALITY, MADE SWEETER</small></span></a>
      <button class="property-switch" data-action="property"><span class="property-icon">⌂</span><span><b>The Gelato Grand</b><small>Goa, India</small></span><span class="switch-chevron">⌄</span></button>
      <nav>${navigation.map(section => `<div class="nav-section"><div class="nav-label">${section.section}</div>${section.items.map(([label,href,icon]) => `<a class="nav-link ${path === href || (href === '/dashboard' && path === '/') || (href === '/reservations' && path === '/reservation-calendar') ? 'active' : ''}" href="${href}" data-route="${href}"><span class="nav-icon">${icon}</span><span>${label}</span>${label==='Reservations'?'<i class="nav-count">4</i>':''}${label==='Housekeeping'?'<i class="nav-count peach">8</i>':''}</a>`).join('')}</div>`).join('')}</nav>
      <div class="sidebar-footer"><div class="help-card"><b>Need a hand? 🍦</b><p>Our little team is here to make your day smoother.</p><button class="text-action" data-action="support">Visit help centre ↗</button></div><div class="user-card"><span class="avatar">${initials('Aarav Mehta')}</span><span><b>Aarav Mehta</b><small>Property manager</small></span><button class="plain-icon" aria-label="User menu" data-action="user-menu">···</button></div></div>
    </aside>
    <main class="main-area"><header class="topbar"><button class="mobile-menu plain-icon" data-action="mobile-menu" aria-label="Toggle menu">☰</button><div class="breadcrumbs"><span>The Gelato Grand</span><i>›</i><b>${escapeHTML(path.split('/').filter(Boolean).at(-1)?.replaceAll('-',' ') || 'dashboard')}</b></div><div class="top-actions"><span class="connection-state ${apiOnline?'online':'offline'}"><i></i>${apiOnline?'Shared data':'Browser demo'}</span><button class="today-pill" data-action="today">☼ &nbsp;${escapeHTML(displayToday('Asia/Kolkata'))}</button><button class="icon-button" data-action="global-search" aria-label="Search">⌕</button><button class="icon-button notification-button" data-action="notifications" aria-label="Notifications">♧<i></i></button><button class="avatar top-avatar" data-action="user-menu">AM</button></div></header><div class="page-container">${content}</div></main>
  </div>`;
}
