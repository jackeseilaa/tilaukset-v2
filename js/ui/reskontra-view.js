import {esc, today, addDays} from "../format.js";

function invTypeBadge(t) {
  if (t === "reservation") return `<span class="badge badge-blue" style="font-size:10px">Varausmaksu</span>`;
  if (t === "partial") return `<span class="badge badge-amber" style="font-size:10px">Osasuoritus</span>`;
  if (t === "credit") return `<span class="badge badge-red" style="font-size:10px">Hyvitys</span>`;
  return `<span class="badge badge-silver" style="font-size:10px">Lasku</span>`;
}

export function renderReskontraView(state) {
  const G = x => Number(x?.grossTotal || 0);
  const customerMap = {};
  for (const inv of state.invoices) {
    const key = inv.payerName || "—";
    if (!customerMap[key]) customerMap[key] = {name: key, email: inv.payerEmail || "", invoices: [], totalGross: 0, totalPaid: 0};
    const g = customerMap[key];
    g.invoices.push(inv);
    g.totalGross += G(inv);
    if (inv.paid) g.totalPaid += G(inv);
  }
  const customers = Object.values(customerMap).sort((a, b) => a.name.localeCompare(b.name));
  const totalAll = customers.reduce((s, c) => s + c.totalGross, 0);
  const totalOpen = customers.reduce((s, c) => s + (c.totalGross - c.totalPaid), 0);
  const openInvoices = state.invoices.filter(x => !x.paid).sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || ""));

  return `<div class="card">
    <div class="row-between"><div><div class="card-title">📊 Reskontra</div><div class="card-sub">Asiakaskohtainen saldo ja avoimet laskut</div></div></div>
    <div class="stats-grid" style="margin:16px 0">
      <div class="stat-card"><div class="stat-label">Laskutettu yht.</div><div class="stat-val" style="font-size:28px">${totalAll.toFixed(2)} €</div></div>
      <div class="stat-card"><div class="stat-label">Avoimet laskut</div><div class="stat-val" style="font-size:28px;color:#991b1b">${totalOpen.toFixed(2)} €</div></div>
      <div class="stat-card"><div class="stat-label">Maksettu yht.</div><div class="stat-val" style="font-size:28px;color:#166534">${(totalAll - totalOpen).toFixed(2)} €</div></div>
    </div>
    <div class="hr"></div>
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin-bottom:10px">⚠️ Avoimet laskut</div>
    ${openInvoices.length === 0 ? `<div class="infobox infobox-green">✓ Ei avoimia laskuja!</div>` : `
    <table class="table"><thead><tr><th>Päivä</th><th>Eräpäivä</th><th>Nro</th><th>Maksaja</th><th>Laji</th><th>Tapahtuma</th><th class="r">Summa</th><th></th></tr></thead>
      <tbody>${openInvoices.map(x => {
        const pd = x.paymentDays != null ? Number(x.paymentDays) : 7;
        const due = x.invoiceDate ? addDays(x.invoiceDate, pd) : "";
        const overdue = due && due < today();
        return `<tr>
          <td>${esc(x.invoiceDate || "")}</td>
          <td style="white-space:nowrap;font-weight:700;color:${overdue ? "#dc2626" : "#166534"}">${due || "—"}${overdue ? " ⚠" : ""}</td>
          <td style="font-weight:700;color:#0a4272">${esc(x.invoiceNo || "")}</td>
          <td>${esc(x.payerName || "")}${x.issuer === "oy" ? ` <span class="badge badge-blue" style="font-size:9px">AJarmo Oy</span>` : ""}</td>
          <td>${invTypeBadge(x.itype)}</td>
          <td class="small muted">${esc(x.eventName || "")}</td>
          <td class="r" style="font-weight:700;color:${G(x) < 0 ? "#991b1b" : "#0a4272"}">${G(x).toFixed(2)} €</td>
          <td><div class="row" style="gap:4px">
            <button class="btn btn-teal btn-sm" data-action="toggle-paid" data-id="${x.id}">✓ Maksettu</button>
            <button class="btn btn-secondary btn-sm" data-action="download-invoice-pdf" data-id="${x.id}">📄 PDF</button>
            <button class="btn btn-secondary btn-sm" data-action="edit-invoice" data-id="${x.id}">Muokkaa</button>
          </div></td>
        </tr>`;
      }).join("")}</tbody>
    </table>`}
    <div class="hr"></div>
    <div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin-bottom:10px">👤 Asiakaskohtainen saldo</div>
    ${customers.length === 0 ? `<div class="infobox infobox-blue">Ei laskuja.</div>` : `
    <table class="table"><thead><tr><th>Asiakas</th><th class="r">Laskutettu</th><th class="r">Maksettu</th><th class="r">Avoin</th><th>Laskut</th></tr></thead>
      <tbody>${customers.map(c => {
        const open = c.totalGross - c.totalPaid;
        return `<tr>
          <td><div style="font-weight:600">${esc(c.name)}</div>${c.email ? `<div class="small muted"><a href="mailto:${esc(c.email)}" style="color:#1e40af">${esc(c.email)}</a></div>` : ""}</td>
          <td class="r">${c.totalGross.toFixed(2)} €</td>
          <td class="r" style="color:#166534">${c.totalPaid.toFixed(2)} €</td>
          <td class="r" style="font-weight:700;color:${open > 0 ? "#991b1b" : open < 0 ? "#92400e" : "#166534"}">${open.toFixed(2)} €</td>
          <td>${c.invoices.map(inv => `<div class="small" style="margin-bottom:3px">${invTypeBadge(inv.itype)} <span style="font-weight:700;color:#0a4272">${esc(inv.invoiceNo)}</span> ${inv.paid ? `<span class="badge badge-green" style="font-size:10px">✓ ${esc(inv.paidDate || "maksettu")}</span>` : `<span class="badge badge-red" style="font-size:10px">● Avoin</span>`} <span style="color:#6b7280">${Number(inv.grossTotal || 0).toFixed(2)} €</span></div>`).join("")}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>`}
  </div>`;
}
