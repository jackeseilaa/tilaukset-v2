import {CONFIG_READY} from "../firebase.js";
import {renderBlockedDaysWidget} from "./blocked-days-widget.js";

export function renderDashboard(state) {
  return `<div class="card">
    <div class="row-between"><div><div class="card-title">Dashboard</div><div class="card-sub">${CONFIG_READY ? "Synkronoitu Firebaseen · data turvassa" : "Demo-tila · ei tallennusta"}</div></div></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Purjehdukset</div><div class="stat-val">${state.sailings.length}</div></div>
      <div class="stat-card"><div class="stat-label">Asiakkaat</div><div class="stat-val">${state.customers.length}</div></div>
      <div class="stat-card"><div class="stat-label">Yritykset</div><div class="stat-val">${state.companies.length}</div></div>
      <div class="stat-card"><div class="stat-label">Laskut</div><div class="stat-val">${state.invoices.length}</div></div>
    </div>
    <div class="infobox infobox-blue">🚧 Rakenteilla: purjehdusten/kalenterin ja laskutuksen hallinta puuttuu vielä. Yritykset, muut tuotteet ja kyselyt toimivat jo omilla välilehdillään.</div>
  </div>
  ${renderBlockedDaysWidget(state)}`;
}
