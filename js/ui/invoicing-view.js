import {esc, fmtDate} from "../format.js";
import {ISSUERS} from "../state.js";
import {computeInvoice, INV_TYPE_LABELS} from "../invoices.js";

function invTypeBadge(t) {
  if (t === "reservation") return `<span class="badge badge-blue" style="font-size:10px">Varausmaksu</span>`;
  if (t === "partial") return `<span class="badge badge-amber" style="font-size:10px">Osasuoritus</span>`;
  if (t === "credit") return `<span class="badge badge-red" style="font-size:10px">Hyvitys</span>`;
  return `<span class="badge badge-silver" style="font-size:10px">Lasku</span>`;
}

function renderRegister(state) {
  const list = state.invoices.slice().sort((a, b) => (b.invoiceDate || "").localeCompare(a.invoiceDate || ""));
  return `<div class="card">
    <div class="card-title">📒 Laskurekisteri</div>
    <div class="card-sub">${list.length} laskua</div>
    <div class="hr"></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei vielä laskuja.</div>` : `
    <table class="table">
      <thead><tr><th>Pvm</th><th>Nro</th><th>Maksaja</th><th>Laji</th><th class="r">Summa</th><th>Tila</th><th></th></tr></thead>
      <tbody>${list.map(x => `<tr>
        <td style="white-space:nowrap">${esc(x.invoiceDate || "")}</td>
        <td style="font-weight:700;color:#0a4272">${esc(x.invoiceNo || "")}</td>
        <td>${esc(x.payerName || "")}${x.issuer === "oy" ? ` <span class="badge badge-blue" style="font-size:9px">AJarmo Oy</span>` : ""}</td>
        <td>${invTypeBadge(x.itype)}</td>
        <td class="r" style="font-weight:700;color:${Number(x.grossTotal || 0) < 0 ? "#991b1b" : "#0a4272"}">${Number(x.grossTotal || 0).toFixed(2)} €</td>
        <td>${x.paid ? `<button class="btn btn-teal btn-sm" data-action="toggle-paid" data-id="${x.id}">✓ Maksettu</button>` : `<button class="btn btn-secondary btn-sm" data-action="toggle-paid" data-id="${x.id}">● Avoin</button>`}</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="edit-invoice" data-id="${x.id}">Muokkaa</button>
          ${!x.isCredit ? `<button class="btn btn-secondary btn-sm" data-action="new-credit-note" data-id="${x.id}">↩ Hyvitä</button>` : ""}
          <button class="btn btn-danger btn-sm" data-action="delete-invoice" data-id="${x.id}">Poista</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>`;
}

export function renderInvoicingView(state) {
  const d = state.invoiceDraft || {};
  const editing = !!state.editInvoiceId;
  const itype = d.type || "full";
  const isCredit = itype === "credit", isPartial = itype === "partial", isReservation = itype === "reservation";
  const selS = state.sailings.find(x => x.id === d.sailingId);
  const hasFee = selS && Number(selS.reservationFee || 0) > 0;
  const inv = computeInvoice(state, d);
  const issuerInfo = ISSUERS[d.issuer || "tmi"] || ISSUERS.tmi;
  const invTitle = isCredit ? "HYVITYSLASKU" : itype === "reservation" ? "LASKU — VARAUSMAKSU" : itype === "partial" ? "LASKU — OSASUORITUS" : "LASKU — LOPPULASKU";

  const sailOpts = state.sailings.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(s => `<option value="${s.id}" ${s.id === d.sailingId ? "selected" : ""}>${esc(s.name)} (${fmtDate(s.date)})</option>`).join("");
  const custOpts = state.customers.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(c => `<option value="${c.id}" ${c.id === d.customerId ? "selected" : ""}>${esc(c.name)}</option>`).join("");
  const coOpts = state.companies.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(co => `<option value="${co.id}" ${co.id === d.companyId ? "selected" : ""}>${esc(co.name)}</option>`).join("");
  const creditRefOpts = state.invoices.filter(x => !x.isCredit).sort((a, b) => (a.invoiceDate || "").localeCompare(b.invoiceDate || "")).map(x => `<option value="${x.id}" ${x.id === d.creditRefId ? "selected" : ""}>${esc(x.invoiceNo)} — ${esc(x.payerName)} — ${Number(x.grossTotal || 0).toFixed(2)} €</option>`).join("");

  return `<div class="card noPrint">
    <div class="card-title">🧾 Laskutus</div>
    <div class="card-sub">${editing ? `Muokkaat laskua <strong>${esc(state.invoices.find(x => x.id === state.editInvoiceId)?.invoiceNo || "")}</strong>` : "Luo lasku purjehdukselle"}</div>
    ${editing ? `<div class="infobox infobox-amber" style="margin-bottom:12px">✎ Muokkaustila — laskunumero säilyy · <button class="btn btn-secondary btn-sm" data-action="cancel-edit-invoice" style="margin-left:8px">✕ Peruuta</button></div>` : ""}
    <div class="infobox infobox-blue" style="margin-bottom:12px">🚧 Vain purjehduspohjaiset laskut toistaiseksi. Tutkinto- ja tuotepohjaiset laskut, PDF-tulostus ja sähköpostilähetys tulevat myöhemmin.</div>
    <div class="hr"></div>
    <div class="grid3" style="margin-bottom:14px">
      <div class="field"><label class="lbl">Laskuttaja</label><select data-bind="invoiceDraft.issuer"><option value="tmi" ${(d.issuer || "tmi") === "tmi" ? "selected" : ""}>J Sailing Tmi</option><option value="oy" ${d.issuer === "oy" ? "selected" : ""}>AJarmo Oy</option></select></div>
      <div class="field"><label class="lbl">Malli</label><select data-bind="invoiceDraft.mode"><option value="customer" ${d.mode === "customer" ? "selected" : ""}>Asiakaskohtainen</option><option value="customer-company" ${d.mode === "customer-company" ? "selected" : ""}>Asiakaskohtainen — yritys maksaa</option><option value="company" ${d.mode === "company" ? "selected" : ""}>Yrityslasku</option></select></div>
      <div class="field"><label class="lbl">Laskulaji</label><select data-bind="invoiceDraft.type"><option value="full" ${itype === "full" ? "selected" : ""}>Loppulasku</option><option value="reservation" ${itype === "reservation" ? "selected" : ""}>Varausmaksu</option><option value="partial" ${itype === "partial" ? "selected" : ""}>Osasuoritus</option><option value="credit" ${itype === "credit" ? "selected" : ""}>Hyvityslasku</option></select></div>
    </div>
    ${!isCredit ? `<div class="field"><label class="lbl">Tapahtuma *</label><select data-bind="invoiceDraft.sailingId"><option value="">-- valitse --</option>${sailOpts}</select></div>` : ""}
    <div class="grid2" style="margin-top:10px">
      <div class="field"><label class="lbl">Päivä</label><input type="date" data-bind="invoiceDraft.invoiceDate" value="${esc(d.invoiceDate || "")}"></div>
      ${(isPartial || (isReservation && !hasFee)) ? `<div class="field"><label class="lbl">${isReservation ? "Varausmaksun summa (€ brutto)" : "Osasuorituksen summa (€ brutto)"}</label><input type="number" min="0" step="0.01" data-bind="invoiceDraft.partialAmount" value="${esc(String(d.partialAmount || ""))}" placeholder="esim. 150.00"></div>` : ""}
    </div>
    ${isCredit ? `<div class="field" style="margin-top:10px"><label class="lbl">Kohdistetaan laskulle</label><select data-bind="invoiceDraft.creditRefId"><option value="">-- valitse alkuperäinen lasku --</option>${creditRefOpts}</select>${inv.creditRef ? `<div class="infobox infobox-amber" style="margin-top:8px">Hyvitetään lasku ${esc(inv.creditRef.invoiceNo)} · ${Number(inv.creditRef.grossTotal || 0).toFixed(2)} €</div>` : ""}</div>` : ""}
    <div class="field" style="margin-top:10px"><label class="lbl">Huomautus laskulle</label><textarea data-bind="invoiceDraft.note" rows="2" placeholder="esim. Meriprojekti">${esc(d.note || "")}</textarea></div>
    <div class="row" style="margin:14px 0;flex-wrap:wrap;gap:10px">
      <div style="flex:1;min-width:200px" class="field"><label class="lbl">Asiakas</label><select data-bind="invoiceDraft.customerId"><option value="">-- valitse --</option>${custOpts}</select></div>
      ${(d.mode === "company" || d.mode === "customer-company") ? `<div style="flex:1;min-width:200px" class="field"><label class="lbl">Yritys</label><select data-bind="invoiceDraft.companyId"><option value="">-- valitse --</option>${coOpts}</select></div>` : ""}
      <div style="min-width:160px" class="field"><label class="lbl">Laskunro (seuraava)</label><div style="padding:10px 13px;border:1.5px solid #d1d5db;border-radius:8px;background:#f0f4f8;font-weight:800;color:#0a4272;font-size:15px">${esc(inv.invNoPreview)}</div><div class="small muted" style="margin-top:4px">Viite: ${esc(inv.reference)}</div></div>
    </div>
  </div>
  <div class="card"><div class="invoice-box">
    <div class="row-between">
      <div style="line-height:1.7;font-size:14px"><strong style="font-size:16px;color:${isCredit ? "#991b1b" : "#111827"}">${invTitle}</strong><br>${esc(issuerInfo.name)}<br>Y-tunnus ${esc(issuerInfo.businessId)}<br>${esc(issuerInfo.address)}<br><span class="small" style="color:#6b7280">IBAN</span> ${esc(issuerInfo.iban)}<br><span class="small" style="color:#6b7280">BIC</span> ${esc(issuerInfo.bic)}</div>
      <div style="text-align:right;line-height:1.7;font-size:14px"><strong style="color:#0a4272;font-size:15px">Nro: ${esc(inv.invNoPreview)}</strong><br>Päivä: ${esc(d.invoiceDate || "")}<br>Viite: <strong>${esc(inv.reference)}</strong>${inv.creditRef ? `<br><span class="small muted">Hyvittää: ${esc(inv.creditRef.invoiceNo)}</span>` : ""}</div>
    </div>
    <div class="hr"></div>
    <div style="font-size:14px;line-height:1.7"><strong>Maksaja:</strong><br>${esc(inv.payerName || "—")}${inv.payerBusinessId ? `<div class="small muted">Y-tunnus ${esc(inv.payerBusinessId)}</div>` : ""}${inv.payerEmail ? `<div><a href="mailto:${esc(inv.payerEmail)}" style="color:#1e40af">${esc(inv.payerEmail)}</a></div>` : ""}</div>
    ${d.note ? `<div style="font-size:13px;color:#374151;margin-top:6px"><strong>Huomautus:</strong> ${esc(d.note)}</div>` : ""}
    <div class="hr"></div>
    <table class="table"><thead><tr><th>Kuvaus</th><th class="r">Kpl</th><th class="r">€/kpl</th><th class="r">Yht</th></tr></thead>
      <tbody>${inv.lines.length === 0 ? `<tr><td colspan="4" class="muted">Valitse tapahtuma ja maksaja.</td></tr>` : inv.lines.map(l => `<tr><td>${esc(l.title)}</td><td class="r">${l.qty}</td><td class="r">${Number(l.unit).toFixed(2)}</td><td class="r" style="${Number(l.total) < 0 ? "color:#991b1b;font-weight:700" : ""}">${Number(l.total).toFixed(2)}</td></tr>`).join("")}</tbody>
    </table>
    <div class="hr"></div>
    <table class="table" style="max-width:280px;margin-left:auto">
      <tr><td>Netto</td><td class="r">${Number(inv.net || 0).toFixed(2)} €</td></tr>
      <tr><td>ALV ${inv.ratePct}%</td><td class="r">${Number(inv.vat || 0).toFixed(2)} €</td></tr>
      <tr><td><strong>Yhteensä</strong></td><td class="r"><strong style="color:${isCredit ? "#991b1b" : "#0a4272"};font-size:18px">${Number(inv.grossTotal || 0).toFixed(2)} €</strong></td></tr>
    </table>
    <div class="hr noPrint"></div>
    <div class="row noPrint"><button class="btn btn-primary" data-action="save-invoice">💾 Tallenna lasku</button></div>
  </div></div>
  ${renderRegister(state)}`;
}
