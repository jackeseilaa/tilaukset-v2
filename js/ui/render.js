import {esc} from "../format.js";
import {CONFIG_READY} from "../firebase.js";
import {NAV_TABS} from "../state.js";
import {registerAction} from "../dispatch.js";
import {renderAuthScreen, bindAuthScreen} from "../auth.js";
import {renderDashboard} from "./dashboard.js";
import {renderSailingsView} from "./sailings-view.js";
import {renderCalendarView} from "./calendar-view.js";
import {renderCustomersView} from "./customers-view.js";
import {renderCompaniesView, renderCompanyModal} from "./companies-view.js";
import {renderSailingModal} from "./sailing-modal.js";
import {renderBlockDayModal} from "./block-day-modal.js";
import {renderCustomerModal} from "./customer-modal.js";
import {renderInvoicingView} from "./invoicing-view.js";
import {renderMuutTuotteetView} from "./muuttuotteet-view.js";
import {renderReskontraView} from "./reskontra-view.js";
import {renderTasmaytysView} from "./tasmaytys-view.js";
import {renderKyselytView} from "./kyselyt-view.js";
import {renderTutkinnotView} from "./tutkinnot-view.js";
import {renderTutkintoModal} from "./tutkinto-modal.js";
import {renderAdminView} from "./admin-view.js";

export const APP_VERSION = "V1.7.1";

registerAction("set-tab", ({el, store}) => { store.setState({tab: el.dataset.tab}); });
registerAction("close-modal", ({store}) => { store.setState({modal: null, editId: null}); });

function renderSetupBanner() {
  return `<div class="firebase-setup">⚠️ <strong>Firebase ei ole vielä konfiguroitu.</strong> Täytä js/firebase.js kun uusi Firebase-projekti on luotu.</div>`;
}

function renderTopBar(state) {
  const u = state.user;
  const syncEl = CONFIG_READY ? `<span id="syncDot" class="sync-dot${state.syncing ? " syncing" : ""}"></span>` : "";
  return `<div class="topbar">
    <div class="topbar-logo">J <em>Sailing</em></div>
    <span style="background:#0a4272;color:#fff;border-radius:4px;padding:1px 6px;font-weight:700;font-size:10px;white-space:nowrap;flex-shrink:0">${APP_VERSION}</span>
    <div style="display:flex;align-items:center;gap:4px;flex-shrink:0">${syncEl}</div>
    <div class="topbar-spacer"></div>
    <div class="topbar-user">
      ${u?.photoURL ? `<img src="${esc(u.photoURL)}" class="topbar-avatar" alt="">` : `<div class="topbar-avatar-placeholder">${(u?.displayName || u?.email || "?")[0].toUpperCase()}</div>`}
      <button class="btn-signout" data-action="sign-out">Ulos</button>
    </div>
  </div>`;
}

function renderNavTabs(state) {
  return `<nav class="nav-tabs">${NAV_TABS.map(([id, label]) =>
    `<button class="nav-tab ${state.tab === id ? "active" : ""}" data-action="set-tab" data-tab="${id}">${label}</button>`
  ).join("")}</nav>`;
}

const VIEW_RENDERERS = {
  dashboard: renderDashboard,
  calendar: renderCalendarView,
  sailings: renderSailingsView,
  muuttuotteet: renderMuutTuotteetView,
  customers: renderCustomersView,
  companies: renderCompaniesView,
  invoicing: renderInvoicingView,
  reskontra: renderReskontraView,
  tasmaytys: renderTasmaytysView,
  kyselyt: renderKyselytView,
  tutkinnot: renderTutkinnotView,
  admin: renderAdminView
};

function renderTab(state) {
  const fn = VIEW_RENDERERS[state.tab] || renderDashboard;
  return fn(state);
}

function renderModal(state) {
  if (state.modal === "company") return renderCompanyModal(state);
  if (state.modal === "sailing") return renderSailingModal(state);
  if (state.modal === "block-day") return renderBlockDayModal(state);
  if (state.modal === "customer") return renderCustomerModal(state);
  if (state.modal === "tutkinto") return renderTutkintoModal(state);
  return "";
}

export function render(store) {
  const state = store.getState();
  const appEl = document.getElementById("app");

  if (!CONFIG_READY) {
    appEl.innerHTML = `<div class="main-content">${renderSetupBanner()}</div>`;
    return;
  }
  if (!state.user) {
    appEl.innerHTML = renderAuthScreen();
    bindAuthScreen();
    return;
  }

  const ae = document.activeElement;
  const keepAction = ae?.dataset?.action || null;
  const keepBind = ae?.dataset?.bind || null;
  const keepPos = (ae && typeof ae.selectionStart === "number") ? ae.selectionStart : null;

  appEl.innerHTML = renderTopBar(state) + renderNavTabs(state) +
    `<div class="main-content">${renderTab(state)}</div>` +
    renderModal(state);

  document.title = `J Sailing ${APP_VERSION} — Hallintapaneeli (v2)`;

  const sel = keepAction ? `[data-action="${keepAction}"]` : keepBind ? `[data-bind="${keepBind}"]` : null;
  if (sel) {
    const el = document.querySelector(sel);
    if (el) {
      el.focus();
      if (keepPos !== null && typeof el.setSelectionRange === "function") {
        try { el.setSelectionRange(keepPos, keepPos); } catch (e) {}
      }
    }
  }
}
