import {esc, fmtDate} from "../format.js";
import {custIdentityKey, custEventLabel, custEventDate, statusBadge} from "../customers.js";

export function renderCustomersView(state) {
  const term = (state.searchCustomers || "").toLowerCase();
  const groups = new Map();
  for (const c of state.customers) {
    const k = custIdentityKey(c);
    if (!groups.has(k)) groups.set(k, {key: k, name: "", phone: "", email: "", items: []});
    const g = groups.get(k);
    g.items.push(c);
    if (c.name && c.name.length > g.name.length) g.name = c.name;
    if (!g.email && c.email) g.email = c.email;
    if (!g.phone && c.phone) g.phone = c.phone;
  }
  let persons = Array.from(groups.values()).filter(p => !term || (p.name || "").toLowerCase().includes(term) || (p.phone || "").toLowerCase().includes(term) || (p.email || "").toLowerCase().includes(term));
  persons.sort((a, b) => {
    const ap = a.items.some(c => (c.reservationStatus || "pending") === "pending") ? 0 : 1;
    const bp = b.items.some(c => (c.reservationStatus || "pending") === "pending") ? 0 : 1;
    return ap - bp || (a.name || "").localeCompare(b.name || "");
  });
  const expanded = state.expandedPerson || null;

  return `<div class="card">
    <div class="row-between">
      <div><div class="card-title">👤 Asiakkaat <span class="badge badge-navy" style="font-size:11px">${groups.size} henkilöä · ${state.customers.length} osallistumista</span></div><div class="card-sub">🔴 Varausmaksu odottaa · 🟢 Vahvistettu · 🟡 Varapaikka</div></div>
      <button class="btn btn-primary" data-action="new-customer">+ Uusi asiakas</button>
    </div>
    <div class="hr"></div>
    <div class="field"><label class="lbl">Haku</label><input data-bind="searchCustomers" value="${esc(state.searchCustomers || "")}" placeholder="Hae nimellä, puhelimella tai sähköpostilla…"></div>
    ${persons.length === 0 ? `<div class="infobox infobox-blue">Ei osumia.</div>` : persons.map(p => {
      const n = p.items.length;
      const open = expanded === p.key;
      const rows = p.items.slice().sort((a, b) => (custEventDate(state, b) || "").localeCompare(custEventDate(state, a) || "")).map(c => {
        const st = c.reservationStatus || "pending", dc = st === "paid" ? "dot-green" : st === "reserve" ? "dot-amber" : "dot-red";
        const co = state.companies.find(x => x.id === c.companyId);
        const evDate = custEventDate(state, c);
        return `<div class="item" style="padding:8px 10px;background:#f8fafc">
          <div style="display:flex;gap:10px;flex:1;align-items:flex-start"><span class="dot ${dc}" style="margin-top:6px;flex-shrink:0"></span>
          <div><h3 style="font-size:14px">${esc(custEventLabel(state, c))} ${evDate ? `<span class="muted small">${esc(fmtDate(evDate))}</span>` : ""}</h3>
          <div class="meta">${statusBadge(st)}${co && c.billTo === "company" ? ` · <span class="badge badge-silver">${esc(co.name)}</span>` : ""}</div></div></div>
          <div class="row" style="flex-shrink:0;align-items:flex-start">${st !== "paid" ? `<button class="btn btn-teal btn-sm" data-action="confirm-payment" data-id="${c.id}">✓ Maksettu</button>` : ""}<button class="btn btn-secondary btn-sm" data-action="edit-customer" data-id="${c.id}">Muokkaa</button><button class="btn btn-danger btn-sm" data-action="delete-customer" data-id="${c.id}">Poista</button></div>
        </div>`;
      }).join("");
      return `<div class="item" style="flex-direction:column;align-items:stretch">
        <div style="display:flex;gap:10px;align-items:center;cursor:pointer" data-action="toggle-person" data-id="${esc(p.key)}">
          <span style="font-size:16px;color:#0a4272">${open ? "▾" : "▸"}</span>
          <div style="flex:1"><h3>${esc(p.name || "(nimetön)")}</h3>
          <div class="meta"><span class="badge badge-silver" style="font-size:10px">${n} osall.</span></div>
          <div class="meta">${p.email ? `<a href="mailto:${esc(p.email)}" style="color:#1e40af">${esc(p.email)}</a>` : ""}${p.email && p.phone ? " · " : ""}${esc(p.phone || "")}</div></div>
        </div>
        ${open ? `<div style="margin-top:8px;display:flex;flex-direction:column;gap:6px">${rows}</div>` : ""}
      </div>`;
    }).join("")}
  </div>`;
}
