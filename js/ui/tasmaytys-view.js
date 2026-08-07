import {esc, fmtDate} from "../format.js";
import {custIdentityKey, custEventLabel, custEventDate} from "../customers.js";

function custExpectedPrice(state, c) {
  if (c.priceOverride != null && c.priceOverride !== "") return Number(c.priceOverride) || 0;
  if (c.sailingId) { const s = state.sailings.find(x => x.id === c.sailingId); return s ? Number(s.pricePerPerson || 0) : 0; }
  return 0;
}

function findOrphanInvoices(state) {
  const custIds = new Set(state.customers.map(c => c.id));
  return state.invoices.filter(x => Array.isArray(x.coveredCustomerIds) && x.coveredCustomerIds.length && x.coveredCustomerIds.some(id => !custIds.has(id)));
}

function isInvoiced(state, c) {
  const eid = c.sailingId || "";
  const direct = state.invoices.some(x =>
    (Array.isArray(x.coveredCustomerIds) && x.coveredCustomerIds.includes(c.id)) ||
    (x.customerId && x.customerId === c.id)
  );
  if (direct) return true;
  const isCo = c.billTo === "company" && !!c.companyId;
  const payerMatch = isCo ? (state.companies.find(co => co.id === c.companyId)?.name || "") : c.name;
  const expected = custExpectedPrice(state, c);
  const totalInv = state.invoices.filter(x => x.payerName === payerMatch && x.eventId === eid).reduce((s, x) => s + Number(x.grossTotal || 0), 0);
  return expected > 0 ? totalInv >= expected - 0.5 : expected === 0;
}

export function renderTasmaytysView(state) {
  const cs = state.customers, invs = state.invoices;
  const persons = new Set(cs.map(custIdentityKey)).size;
  const laskutettu = invs.reduce((s, x) => s + Number(x.grossTotal || 0), 0);
  const maksettu = invs.filter(x => x.paid).reduce((s, x) => s + Number(x.grossTotal || 0), 0);
  const avoin = invs.filter(x => !x.paid).reduce((s, x) => s + Number(x.grossTotal || 0), 0);
  const uncovered = cs.filter(c => c.sailingId && !isInvoiced(state, c));
  const orphanInvoices = findOrphanInvoices(state);

  return `<div class="card">
    <div class="card-title">🔍 Laskutuksen täsmäytys</div>
    <div class="card-sub">Vertaa asiakasrekisteriä ja laskurekisteriä — lue-vain, ei muuta dataa.</div>
    <div class="hr"></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px">
      <div class="stat-card"><div class="stat-label">Henkilöitä</div><div class="stat-val">${persons}</div></div>
      <div class="stat-card"><div class="stat-label">Osallistumisia</div><div class="stat-val">${cs.length}</div></div>
      <div class="stat-card"><div class="stat-label">Laskuja</div><div class="stat-val">${invs.length}</div></div>
      <div class="stat-card"><div class="stat-label">Laskutettu</div><div class="stat-val" style="font-size:18px">${laskutettu.toFixed(0)} €</div></div>
      <div class="stat-card"><div class="stat-label">Maksettu</div><div class="stat-val" style="font-size:18px;color:#166534">${maksettu.toFixed(0)} €</div></div>
      <div class="stat-card"><div class="stat-label">Avoinna</div><div class="stat-val" style="font-size:18px;color:${avoin > 0 ? "#991b1b" : "#166534"}">${avoin.toFixed(0)} €</div></div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">⚠️ Osallistujat ilman laskua <span class="badge ${uncovered.length ? "badge-red" : "badge-green"}" style="font-size:11px">${uncovered.length}</span></div>
    <div class="hr"></div>
    ${uncovered.length === 0 ? `<div class="infobox infobox-green">Kaikki osallistumiset on laskutettu. ✅</div>` : `
    <table class="table"><thead><tr><th>Nimi</th><th>Tapahtuma</th><th>Pvm</th><th class="r">Odotettu</th><th></th></tr></thead>
      <tbody>${uncovered.slice().sort((a, b) => (custEventDate(state, b) || "").localeCompare(custEventDate(state, a) || "")).map(c => `<tr>
        <td>${esc(c.name || "")}</td>
        <td class="small">${esc(custEventLabel(state, c))}</td>
        <td class="small muted">${fmtDate(custEventDate(state, c))}</td>
        <td class="r">${custExpectedPrice(state, c).toFixed(0)} €</td>
        <td><button class="btn btn-secondary btn-sm" data-action="edit-customer" data-id="${c.id}">Näytä</button></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>
  <div class="card">
    <div class="card-title">🧾 Orpolaskut <span class="badge ${orphanInvoices.length ? "badge-red" : "badge-green"}" style="font-size:11px">${orphanInvoices.length}</span></div>
    <div class="card-sub">Lasku viittaa poistettuun asiakastietueeseen (coveredCustomerIds).</div>
    <div class="hr"></div>
    ${orphanInvoices.length === 0 ? `<div class="infobox infobox-green">Ei orpolaskuja. ✅</div>` : `
    <table class="table"><thead><tr><th>Nro</th><th>Pvm</th><th>Maksaja</th><th class="r">Summa</th><th></th></tr></thead>
      <tbody>${orphanInvoices.map(x => `<tr>
        <td style="font-weight:700;color:#0a4272">${esc(x.invoiceNo || "")}</td>
        <td class="small">${esc(x.invoiceDate || "")}</td>
        <td class="small">${esc(x.payerName || "")}</td>
        <td class="r">${Number(x.grossTotal || 0).toFixed(2)} €</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="download-invoice-pdf" data-id="${x.id}">📄 PDF</button>
          <button class="btn btn-secondary btn-sm" data-action="edit-invoice" data-id="${x.id}">Muokkaa</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>`;
}
