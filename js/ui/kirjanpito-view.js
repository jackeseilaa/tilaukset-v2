import {today} from "../format.js";
import {registerAction} from "../dispatch.js";
import {downloadCsv} from "../csv.js";

const csv2 = n => (Number(n) || 0).toFixed(2).replace(".", ",");

// Laskun ALV-erittely kannoittain. Uudet laskut kantavat valmiin
// vatBreakdown-taulukon; vanhemmilta (ennen V1.7.0) se puuttuu, jolloin
// koko lasku on yhdellä kannalla (vatRatePct).
function rateBuckets(inv) {
  const bd = Array.isArray(inv.vatBreakdown) && inv.vatBreakdown.length
    ? inv.vatBreakdown
    : [{ratePct: Number(inv.vatRatePct || 0), net: Number(inv.net || 0), vat: Number(inv.vat || 0), gross: Number(inv.grossTotal || 0)}];
  return bd.map(b => {
    const net = Number(b.net || 0);
    const vat = Number(b.vat || 0);
    return {ratePct: Number(b.ratePct || 0), net, vat, gross: Number(b.gross != null ? b.gross : net + vat)};
  });
}

function issuerKey(inv) {
  return inv.issuer === "oy" ? "oy" : "tmi";
}

const ISSUER_LABELS = {tmi: "J Sailing Tmi", oy: "AJarmo Oy"};

function fmtMonth(key) {
  const [y, m] = key.split("-");
  return `${Number(m)}/${y}`;
}

function fmtEur(n) {
  return (Number(n) || 0).toLocaleString("fi-FI", {minimumFractionDigits: 2, maximumFractionDigits: 2}) + " €";
}

function fmtRate(r) {
  return String(r).replace(".", ",") + " %";
}

// Ryhmittelee laskut kuukausittain annetun päivämääräkentän mukaan.
// dateField: "invoiceDate" (laskutetut) tai "paidDate" (maksetut).
function groupByMonth(invoices, dateField, year) {
  const months = new Map(); // "2026-01" -> {count, net, vat, gross, rates: Map(rate -> {net,vat,gross})}
  const ratesSeen = new Set();
  let missingDate = 0;
  for (const inv of invoices) {
    const d = (inv[dateField] || "").slice(0, 10);
    if (!d) { missingDate++; continue; }
    if (year !== "all" && d.slice(0, 4) !== year) continue;
    const key = d.slice(0, 7);
    if (!months.has(key)) months.set(key, {count: 0, net: 0, vat: 0, gross: 0, rates: new Map()});
    const mo = months.get(key);
    mo.count++;
    for (const b of rateBuckets(inv)) {
      mo.net += b.net; mo.vat += b.vat; mo.gross += b.gross;
      ratesSeen.add(b.ratePct);
      if (!mo.rates.has(b.ratePct)) mo.rates.set(b.ratePct, {net: 0, vat: 0, gross: 0});
      const r = mo.rates.get(b.ratePct);
      r.net += b.net; r.vat += b.vat; r.gross += b.gross;
    }
  }
  const sortedKeys = [...months.keys()].sort();
  const sortedRates = [...ratesSeen].sort((a, b) => b - a);
  return {months, sortedKeys, sortedRates, missingDate};
}

function monthTable(title, grp) {
  if (grp.sortedKeys.length === 0) {
    return `<div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin:14px 0 8px">${title}</div>
      <div class="infobox infobox-blue">Ei laskuja tällä jaksolla.</div>`;
  }
  const rateCols = grp.sortedRates;
  const tot = {count: 0, net: 0, vat: 0, gross: 0, rates: new Map()};
  const body = grp.sortedKeys.map(key => {
    const mo = grp.months.get(key);
    tot.count += mo.count; tot.net += mo.net; tot.vat += mo.vat; tot.gross += mo.gross;
    for (const rate of rateCols) {
      const r = mo.rates.get(rate);
      if (r) {
        if (!tot.rates.has(rate)) tot.rates.set(rate, {net: 0, vat: 0, gross: 0});
        const t = tot.rates.get(rate);
        t.net += r.net; t.vat += r.vat; t.gross += r.gross;
      }
    }
    return `<tr>
      <td style="white-space:nowrap">${fmtMonth(key)}</td>
      <td class="r">${mo.count}</td>
      <td class="r">${fmtEur(mo.net)}</td>
      ${rateCols.map(rate => `<td class="r">${mo.rates.has(rate) ? fmtEur(mo.rates.get(rate).vat) : "–"}</td>`).join("")}
      <td class="r">${fmtEur(mo.vat)}</td>
      <td class="r" style="font-weight:700">${fmtEur(mo.gross)}</td>
    </tr>`;
  }).join("");
  return `<div style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin:14px 0 8px">${title}</div>
    <div style="overflow-x:auto"><table class="table">
      <thead><tr>
        <th>Kuukausi</th><th class="r">Laskuja</th><th class="r">Netto</th>
        ${rateCols.map(rate => `<th class="r">ALV ${fmtRate(rate)}</th>`).join("")}
        <th class="r">ALV yht.</th><th class="r">Brutto</th>
      </tr></thead>
      <tbody>${body}</tbody>
      <tfoot><tr style="font-weight:800;border-top:2px solid #0a4272">
        <td>Yhteensä</td><td class="r">${tot.count}</td><td class="r">${fmtEur(tot.net)}</td>
        ${rateCols.map(rate => `<td class="r">${tot.rates.has(rate) ? fmtEur(tot.rates.get(rate).vat) : "–"}</td>`).join("")}
        <td class="r">${fmtEur(tot.vat)}</td><td class="r">${fmtEur(tot.gross)}</td>
      </tr></tfoot>
    </table></div>`;
}

function availableYears(invoices) {
  const yearsSet = new Set();
  for (const inv of invoices) {
    if (inv.invoiceDate) yearsSet.add(inv.invoiceDate.slice(0, 4));
    if (inv.paid && inv.paidDate) yearsSet.add(inv.paidDate.slice(0, 4));
  }
  return [...yearsSet].filter(Boolean).sort().reverse();
}

function resolveYear(state) {
  const years = availableYears(state.invoices || []);
  return state.kirjanpitoYear || years[0] || "all";
}

export function renderKirjanpitoView(state) {
  const invoices = state.invoices || [];
  const years = availableYears(invoices);
  const year = resolveYear(state);

  const paidInvoices = invoices.filter(x => x.paid);
  const paidNoDate = paidInvoices.filter(x => !x.paidDate).length;

  const sections = ["tmi", "oy"].map(iss => {
    const issInv = invoices.filter(x => issuerKey(x) === iss);
    const issPaid = issInv.filter(x => x.paid);
    const billed = groupByMonth(issInv, "invoiceDate", year);
    const paid = groupByMonth(issPaid, "paidDate", year);
    if (billed.sortedKeys.length === 0 && paid.sortedKeys.length === 0) return "";
    return `<div class="card">
      <div class="card-title">${ISSUER_LABELS[iss]}</div>
      ${monthTable("Laskutetut (laskun päivän mukaan)", billed)}
      ${monthTable("Maksetut (maksupäivän mukaan)", paid)}
    </div>`;
  }).join("");

  const yearOpts = [`<option value="all" ${year === "all" ? "selected" : ""}>Kaikki vuodet</option>`]
    .concat(years.map(y => `<option value="${y}" ${y === year ? "selected" : ""}>${y}</option>`)).join("");

  return `<div class="card noPrint">
    <div class="row-between">
      <div>
        <div class="card-title">📆 Kirjanpito</div>
        <div class="card-sub">Kuukausierittely laskutetuista ja maksetuista — J Sailing Tmi ja AJarmo Oy erikseen, ALV-kannoittain.</div>
      </div>
      <div class="row" style="gap:8px;align-items:center">
        <select data-bind="kirjanpitoYear" style="min-width:130px">${yearOpts}</select>
        <button class="btn btn-secondary" data-action="export-kirjanpito-csv">📄 Lataa CSV</button>
      </div>
    </div>
    ${paidNoDate > 0 ? `<div class="infobox infobox-amber" style="margin-top:12px">⚠️ ${paidNoDate} maksetuksi merkittyä laskua ilman maksupäivää — ne eivät näy "Maksetut"-taulukossa. Lisää maksupäivä Laskutus- tai Reskontra-välilehdellä laskurivin päivämääräkenttään.</div>` : ""}
  </div>
  ${sections || `<div class="card"><div class="infobox infobox-blue">Ei laskuja valitulla jaksolla.</div></div>`}`;
}

// CSV kirjanpitäjälle: yksi rivi per yhtiö × erä (Laskutettu/Maksettu) × kuukausi
// × ALV-kanta. Puolipiste-erotin, pilkkudesimaali (suomalainen Excel).
registerAction("export-kirjanpito-csv", ({store}) => {
  const state = store.getState();
  const invoices = state.invoices || [];
  const year = resolveYear(state);
  const rows = [];
  for (const iss of ["tmi", "oy"]) {
    const issInv = invoices.filter(x => issuerKey(x) === iss);
    const parts = [
      ["Laskutettu", groupByMonth(issInv, "invoiceDate", year)],
      ["Maksettu", groupByMonth(issInv.filter(x => x.paid), "paidDate", year)]
    ];
    for (const [label, grp] of parts) {
      for (const key of grp.sortedKeys) {
        const mo = grp.months.get(key);
        for (const [rate, r] of [...mo.rates.entries()].sort((a, b) => b[0] - a[0])) {
          rows.push([
            ISSUER_LABELS[iss], label, key, fmtRate(rate),
            csv2(r.net), csv2(r.vat), csv2(r.gross)
          ]);
        }
      }
    }
  }
  downloadCsv(
    `kirjanpito_${year}_${today()}.csv`,
    ["Yhtiö", "Erä", "Kuukausi", "ALV-kanta", "Netto", "ALV", "Brutto"],
    rows
  );
});
