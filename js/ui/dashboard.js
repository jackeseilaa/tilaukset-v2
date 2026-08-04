import {CONFIG_READY} from "../firebase.js";

export function renderDashboard(state) {
  return `<div class="card">
    <div class="row-between">
      <div><div class="card-title">Dashboard</div><div class="card-sub">${CONFIG_READY ? "Synkronoitu Firebaseen · data turvassa" : "Demo-tila · ei tallennusta"}</div></div>
      <div class="row noPrint" style="gap:8px">
        <button class="btn btn-secondary noPrint" data-action="export-json">💾 Varmuuskopio (JSON)</button>
        <label class="btn btn-secondary noPrint" style="cursor:pointer">🔄 Palauta (JSON)<input type="file" accept="application/json" data-file-action="restore-json" style="display:none"></label>
        <button class="btn btn-secondary noPrint" data-action="export-customers-csv">📄 CSV Asiakkaat</button>
        <button class="btn btn-secondary noPrint" data-action="export-sailings-csv">📄 CSV Purjehdukset</button>
      </div>
    </div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Purjehdukset</div><div class="stat-val">${state.sailings.length}</div></div>
      <div class="stat-card"><div class="stat-label">Asiakkaat</div><div class="stat-val">${state.customers.length}</div></div>
      <div class="stat-card"><div class="stat-label">Yritykset</div><div class="stat-val">${state.companies.length}</div></div>
      <div class="stat-card"><div class="stat-label">Laskut</div><div class="stat-val">${state.invoices.length}</div></div>
    </div>
    <div class="infobox infobox-blue">✅ Kaikki keskeiset toiminnot valmiit: Purjehdukset, Kalenteri, Asiakkaat, Yritykset, Muut tuotteet, Kyselyt, Laskutus, Reskontra, Täsmäytys, Tutkinnot, Admin.</div>
  </div>`;
}
