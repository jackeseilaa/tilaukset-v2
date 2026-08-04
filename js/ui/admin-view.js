import {esc} from "../format.js";
import {findOrphanCustomers, findDuplicatePersons} from "../admin.js";

// Korvaa vanhan sovelluksen 8 julkista, kirjautumatonta debug-sivua
// (diag.html ym.) — samat tarkistukset, mutta kirjautumisen takana kuten
// koko muukin sovellus, ei erillisinä julkisesti saavutettavina sivuina.
export function renderAdminView(state) {
  const orphans = findOrphanCustomers(state);
  const dups = findDuplicatePersons(state);

  return `<div class="card">
    <div class="card-title">🛠️ Admin</div>
    <div class="card-sub">Datan eheystarkistukset — lue-vain, paitsi erikseen merkityt toiminnot.</div>
    <div class="hr"></div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Purjehduksia</div><div class="stat-val">${state.sailings.length}</div></div>
      <div class="stat-card"><div class="stat-label">Asiakkaita</div><div class="stat-val">${state.customers.length}</div></div>
      <div class="stat-card"><div class="stat-label">Laskuja</div><div class="stat-val">${state.invoices.length}</div></div>
      <div class="stat-card"><div class="stat-label">Tutkintoja</div><div class="stat-val">${state.tutkinnot.length}</div></div>
    </div>
  </div>
  <div class="card">
    <div class="row-between">
      <div class="card-title">🧹 Orvot asiakastietueet <span class="badge ${orphans.length ? "badge-red" : "badge-green"}" style="font-size:11px">${orphans.length}</span></div>
      ${orphans.length > 0 ? `<button class="btn btn-danger btn-sm" data-action="delete-orphan-customers">🗑️ Poista kaikki orvot</button>` : ""}
    </div>
    <div class="card-sub">Asiakastietue viittaa purjehdukseen tai tutkintoon joka on poistettu.</div>
    <div class="hr"></div>
    ${orphans.length === 0 ? `<div class="infobox infobox-green">Ei orpoja tietueita. ✅</div>` : `
    <table class="table"><thead><tr><th>Nimi</th><th>Sähköposti</th><th>Puhelin</th></tr></thead>
      <tbody>${orphans.map(c => `<tr><td>${esc(c.name || "")}</td><td class="small muted">${esc(c.email || "")}</td><td class="small muted">${esc(c.phone || "")}</td></tr>`).join("")}</tbody>
    </table>`}
  </div>
  <div class="card">
    <div class="card-title">🔁 Mahdolliset tuplahenkilöt <span class="badge ${dups.length ? "badge-amber" : "badge-green"}" style="font-size:11px">${dups.length}</span></div>
    <div class="card-sub">Sama nimi, mutta eri yhteystiedot (sähköposti/puhelin) — voivat olla sama henkilö tai eri henkilöt.</div>
    <div class="hr"></div>
    ${dups.length === 0 ? `<div class="infobox infobox-green">Ei havaittuja tuplia. ✅</div>` : dups.map(([name, keys]) => `<div class="item" style="padding:8px 10px"><div><strong>${esc(name)}</strong> <span class="muted small">${keys.size} eri yhteystietoa</span></div></div>`).join("")}
  </div>`;
}
