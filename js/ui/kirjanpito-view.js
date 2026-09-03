import {today, esc} from "../format.js";
import {registerAction} from "../dispatch.js";
import {downloadCsv} from "../csv.js";
import {elementToPdf} from "../pdf.js";

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

const ISSUERS = [["tmi", "J Sailing Tmi"], ["oy", "AJarmo Oy"]];

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

const inMonth = (d, month) => (d || "").slice(0, 7) === month;
const inYear = (d, year) => year === "all" || (d || "").slice(0, 4) === year;

// ── Yhteenveto: kuukausiriveittäin ────────────────────────────────────────────

function groupByMonth(invoices, dateField, year) {
  const months = new Map();
  const ratesSeen = new Set();
  for (const inv of invoices) {
    const d = (inv[dateField] || "").slice(0, 10);
    if (!d || !inYear(d, year)) continue;
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
  return {months, sortedKeys: [...months.keys()].sort(), sortedRates: [...ratesSeen].sort((a, b) => b - a)};
}

function monthTable(title, grp) {
  if (grp.sortedKeys.length === 0) {
    return `<div class="kp-sub">${title}</div><div class="infobox infobox-blue">Ei laskuja tällä jaksolla.</div>`;
  }
  const rateCols = grp.sortedRates;
  const tot = {count: 0, net: 0, vat: 0, gross: 0, rates: new Map()};
  const body = grp.sortedKeys.map(key => {
    const mo = grp.months.get(key);
    tot.count += mo.count; tot.net += mo.net; tot.vat += mo.vat; tot.gross += mo.gross;
    for (const rate of rateCols) {
      const r = mo.rates.get(rate);
      if (!r) continue;
      if (!tot.rates.has(rate)) tot.rates.set(rate, {net: 0, vat: 0, gross: 0});
      const t = tot.rates.get(rate);
      t.net += r.net; t.vat += r.vat; t.gross += r.gross;
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
  return `<div class="kp-sub">${title}</div>
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

// ── Kuukauden erittely: laskuriveittäin, tulostettava ─────────────────────────

function detailTable(title, list, dateField) {
  const showPaidCol = dateField === "paidDate";
  const rateTotals = new Map();
  let tNet = 0, tVat = 0, tGross = 0;
  const rows = list.map(inv => {
    const bk = rateBuckets(inv);
    const tila = inv.paid
      ? `✓ ${esc(inv.paidDate || "maksettu")}`
      : `<span style="color:#991b1b">avoin</span>`;
    let net = 0, vat = 0, gross = 0;
    for (const b of bk) {
      net += b.net; vat += b.vat; gross += b.gross;
      if (!rateTotals.has(b.ratePct)) rateTotals.set(b.ratePct, {net: 0, vat: 0});
      const rt = rateTotals.get(b.ratePct);
      rt.net += b.net; rt.vat += b.vat;
    }
    tNet += net; tVat += vat; tGross += gross;
    return `<tr>
      <td style="font-weight:700;color:#0a4272;white-space:nowrap">${esc(inv.invoiceNo || "")}</td>
      <td style="white-space:nowrap">${esc(inv.invoiceDate || "")}</td>
      ${showPaidCol ? `<td style="white-space:nowrap">${esc(inv.paidDate || "")}</td>` : ""}
      <td>${esc(inv.payerName || "")}</td>
      <td class="small muted">${esc(inv.eventName || "")}</td>
      <td class="r">${fmtEur(net)}</td>
      <td class="r">${fmtEur(vat)}</td>
      <td class="r" style="font-weight:700">${fmtEur(gross)}</td>
      ${!showPaidCol ? `<td class="small">${tila}</td>` : ""}
    </tr>`;
  }).join("");
  const rateSummary = [...rateTotals.entries()].sort((a, b) => b[0] - a[0])
    .map(([rate, v]) => `ALV ${fmtRate(rate)}: netto ${fmtEur(v.net)} · vero ${fmtEur(v.vat)}`).join(" &nbsp;·&nbsp; ");
  return `<div class="kp-sub">${title} <span style="color:#6b7280;font-weight:400">(${list.length} kpl)</span></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei laskuja.</div>` : `
    <div style="overflow-x:auto"><table class="table">
      <thead><tr>
        <th>Nro</th><th>Laskun pvm</th>${showPaidCol ? "<th>Maksupäivä</th>" : ""}<th>Maksaja</th><th>Tapahtuma</th>
        <th class="r">Netto</th><th class="r">ALV</th><th class="r">Brutto</th>${!showPaidCol ? "<th>Tila</th>" : ""}
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="font-weight:800;border-top:2px solid #0a4272">
          <td colspan="${showPaidCol ? 5 : 4}">Yhteensä</td>
          <td class="r">${fmtEur(tNet)}</td><td class="r">${fmtEur(tVat)}</td><td class="r">${fmtEur(tGross)}</td>
          ${!showPaidCol ? "<td></td>" : ""}
        </tr>
        <tr><td colspan="8" class="small muted" style="padding-top:6px">${rateSummary || "—"}</td></tr>
      </tfoot>
    </table></div>`}`;
}

function monthDetailSection(iss, label, invoices, month) {
  const issInv = invoices.filter(x => issuerKey(x) === iss);
  const billed = issInv.filter(x => inMonth(x.invoiceDate, month)).sort((a, b) => (a.invoiceNo || "").localeCompare(b.invoiceNo || ""));
  const paid = issInv.filter(x => x.paid && inMonth(x.paidDate, month)).sort((a, b) => (a.paidDate || "").localeCompare(b.paidDate || ""));
  if (billed.length === 0 && paid.length === 0) return "";
  return `<div class="card kp-print-section">
    <div class="card-title">${label} — kirjanpidon erittely ${fmtMonth(month)}</div>
    <div class="card-sub">Laskutetut laskun päivän mukaan · maksetut maksupäivän mukaan</div>
    <div class="hr"></div>
    ${detailTable("Laskutetut", billed, "invoiceDate")}
    <div class="hr"></div>
    ${detailTable("Maksetut", paid, "paidDate")}
  </div>`;
}

// ── Näkymä ───────────────────────────────────────────────────────────────────

function availableYears(invoices) {
  const s = new Set();
  for (const inv of invoices) {
    if (inv.invoiceDate) s.add(inv.invoiceDate.slice(0, 4));
    if (inv.paid && inv.paidDate) s.add(inv.paidDate.slice(0, 4));
  }
  return [...s].filter(Boolean).sort().reverse();
}

function availableMonths(invoices) {
  const s = new Set();
  for (const inv of invoices) {
    if (inv.invoiceDate) s.add(inv.invoiceDate.slice(0, 7));
    if (inv.paid && inv.paidDate) s.add(inv.paidDate.slice(0, 7));
  }
  return [...s].filter(Boolean).sort().reverse();
}

function resolveYear(state) {
  return state.kirjanpitoYear || availableYears(state.invoices || [])[0] || "all";
}

export function renderKirjanpitoView(state) {
  const invoices = state.invoices || [];
  const years = availableYears(invoices);
  const months = availableMonths(invoices);
  const year = resolveYear(state);
  const month = state.kirjanpitoMonth || "";

  const paidNoDate = invoices.filter(x => x.paid && !x.paidDate).length;

  const yearOpts = [`<option value="all" ${year === "all" ? "selected" : ""}>Kaikki vuodet</option>`]
    .concat(years.map(y => `<option value="${y}" ${y === year ? "selected" : ""}>${y}</option>`)).join("");
  const monthOpts = [`<option value="" ${!month ? "selected" : ""}>Koko vuosi (yhteenveto)</option>`]
    .concat(months.map(m => `<option value="${m}" ${m === month ? "selected" : ""}>${fmtMonth(m)}</option>`)).join("");

  let content;
  if (month) {
    const sections = ISSUERS.map(([iss, label]) => monthDetailSection(iss, label, invoices, month)).join("");
    content = sections || `<div class="card"><div class="infobox infobox-blue">Ei laskuja kuukaudelle ${fmtMonth(month)}.</div></div>`;
  } else {
    const sections = ISSUERS.map(([iss, label]) => {
      const issInv = invoices.filter(x => issuerKey(x) === iss);
      const billed = groupByMonth(issInv, "invoiceDate", year);
      const paid = groupByMonth(issInv.filter(x => x.paid), "paidDate", year);
      if (billed.sortedKeys.length === 0 && paid.sortedKeys.length === 0) return "";
      return `<div class="card">
        <div class="card-title">${label}</div>
        ${monthTable("Laskutetut (laskun päivän mukaan)", billed)}
        ${monthTable("Maksetut (maksupäivän mukaan)", paid)}
      </div>`;
    }).join("");
    content = sections || `<div class="card"><div class="infobox infobox-blue">Ei laskuja valitulla jaksolla.</div></div>`;
  }

  return `<style>.kp-sub{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:#6b7280;margin:14px 0 8px}</style>
  <div class="card noPrint">
    <div class="row-between">
      <div>
        <div class="card-title">📆 Kirjanpito</div>
        <div class="card-sub">Kuukausierittely yrityksittäin — J Sailing Tmi ja AJarmo Oy erikseen, ALV-kannoittain. Valitse kuukausi ja lataa erittely PDF:nä kirjanpitoon.</div>
      </div>
      <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap">
        ${!month ? `<select data-bind="kirjanpitoYear" style="min-width:120px">${yearOpts}</select>` : ""}
        <select data-bind="kirjanpitoMonth" style="min-width:150px">${monthOpts}</select>
        ${month ? `<button class="btn btn-primary" data-action="print-kirjanpito">📄 Lataa PDF</button>` : ""}
        <button class="btn btn-secondary" data-action="export-kirjanpito-csv">📄 Lataa CSV</button>
      </div>
    </div>
    ${paidNoDate > 0 ? `<div class="infobox infobox-amber" style="margin-top:12px">⚠️ ${paidNoDate} maksetuksi merkittyä laskua ilman maksupäivää — ne eivät näy "Maksetut"-erittelyssä. Lisää maksupäivä Laskutus- tai Reskontra-välilehdellä.</div>` : ""}
  </div>
  ${content}`;
}

// PDF-lataus: rasteroidaan erittely näkymättömästi liitetystä A4-levyisestä
// elementistä ja tallennetaan tiedostoksi. Ei window.print()-kutsua eikä uutta
// välilehteä — molemmat osoittautuivat epäluotettaviksi käyttäjän ympäristössä
// (webnäkymä jossa window.print() ei tee mitään). Sama html2canvas+jsPDF-
// putki kuin laskujen PDF:ssä (js/pdf.js), joka toimii tässä ympäristössä.
function pdfSheetCss() {
  return `#kpSheet{width:794px;padding:44px 52px;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a}
    #kpSheet h1{font-size:19px;color:#0a4272;margin:0 0 3px}
    #kpSheet .meta{font-size:11px;color:#6b7280;margin-bottom:22px}
    #kpSheet .sec{margin:0 0 30px}
    #kpSheet .sec-title{font-size:15px;font-weight:700;color:#0a4272;margin-bottom:1px}
    #kpSheet .sec-sub{font-size:10.5px;color:#6b7280;margin-bottom:10px}
    #kpSheet .kp-sub{font-weight:700;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#6b7280;margin:14px 0 5px}
    #kpSheet table{width:100%;border-collapse:collapse;font-size:10.5px}
    #kpSheet th,#kpSheet td{padding:3px 6px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
    #kpSheet th{background:#f4f6f8;font-size:8.5px;text-transform:uppercase;letter-spacing:.3px;color:#555}
    #kpSheet td.r,#kpSheet th.r{text-align:right;white-space:nowrap}
    #kpSheet tfoot td{border-top:2px solid #0a4272;border-bottom:none;font-weight:700}
    #kpSheet .small{font-size:9.5px}#kpSheet .muted{color:#6b7280}
    #kpSheet .empty{padding:6px 0;font-size:11px;color:#6b7280}`;
}

// Erittely PDF-levylle — sama sisältö kuin ruudulla, mutta luokat scopetettu
// #kpSheet:iin jotta html2canvas piirtää sen oikein irrallaan sovelluksen CSS:stä.
function detailBlock(title, list, dateField) {
  const showPaid = dateField === "paidDate";
  if (list.length === 0) return `<div class="kp-sub">${title} (0 kpl)</div><div class="empty">Ei laskuja.</div>`;
  const rateTotals = new Map();
  let tNet = 0, tVat = 0, tGross = 0;
  const rows = list.map(inv => {
    let net = 0, vat = 0, gross = 0;
    for (const b of rateBuckets(inv)) {
      net += b.net; vat += b.vat; gross += b.gross;
      if (!rateTotals.has(b.ratePct)) rateTotals.set(b.ratePct, {net: 0, vat: 0});
      const rt = rateTotals.get(b.ratePct); rt.net += b.net; rt.vat += b.vat;
    }
    tNet += net; tVat += vat; tGross += gross;
    return `<tr>
      <td style="white-space:nowrap;color:#0a4272;font-weight:700">${esc(inv.invoiceNo || "")}</td>
      <td style="white-space:nowrap">${esc(inv.invoiceDate || "")}</td>
      ${showPaid ? `<td style="white-space:nowrap">${esc(inv.paidDate || "")}</td>` : ""}
      <td>${esc(inv.payerName || "")}</td>
      <td class="small muted">${esc(inv.eventName || "")}</td>
      <td class="r">${fmtEur(net)}</td><td class="r">${fmtEur(vat)}</td><td class="r">${fmtEur(gross)}</td>
    </tr>`;
  }).join("");
  const rateSummary = [...rateTotals.entries()].sort((a, b) => b[0] - a[0])
    .map(([r, v]) => `ALV ${fmtRate(r)}: netto ${fmtEur(v.net)}, vero ${fmtEur(v.vat)}`).join("  ·  ");
  return `<div class="kp-sub">${title} (${list.length} kpl)</div>
    <table>
      <thead><tr><th>Nro</th><th>Laskun pvm</th>${showPaid ? "<th>Maksupäivä</th>" : ""}<th>Maksaja</th><th>Tapahtuma</th>
        <th class="r">Netto</th><th class="r">ALV</th><th class="r">Brutto</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr><td colspan="${showPaid ? 5 : 4}">Yhteensä</td><td class="r">${fmtEur(tNet)}</td><td class="r">${fmtEur(tVat)}</td><td class="r">${fmtEur(tGross)}</td></tr>
        <tr><td colspan="8" class="small muted" style="font-weight:400;padding-top:5px">${rateSummary || "—"}</td></tr>
      </tfoot>
    </table>`;
}

function buildKpSheetInner(invoices, month) {
  const blocks = ISSUERS.map(([iss, label]) => {
    const issInv = invoices.filter(x => issuerKey(x) === iss);
    const billed = issInv.filter(x => inMonth(x.invoiceDate, month)).sort((a, b) => (a.invoiceNo || "").localeCompare(b.invoiceNo || ""));
    const paid = issInv.filter(x => x.paid && inMonth(x.paidDate, month)).sort((a, b) => (a.paidDate || "").localeCompare(b.paidDate || ""));
    if (billed.length === 0 && paid.length === 0) return "";
    return `<div class="sec">
      <div class="sec-title">${label}</div>
      <div class="sec-sub">Laskutetut laskun päivän mukaan · maksetut maksupäivän mukaan</div>
      ${detailBlock("Laskutetut", billed, "invoiceDate")}
      ${detailBlock("Maksetut", paid, "paidDate")}
    </div>`;
  }).join("");
  return `<div id="kpSheet">
    <h1>Kirjanpidon erittely</h1>
    <div class="meta">Kuukausi ${fmtMonth(month)} · tulostettu ${today()}</div>
    ${blocks || `<div class="empty">Ei laskuja kuukaudelle ${fmtMonth(month)}.</div>`}
  </div>`;
}

registerAction("print-kirjanpito", async ({store}) => {
  const state = store.getState();
  const month = state.kirjanpitoMonth || "";
  if (!month) return;
  if (!window.html2canvas || !window.jspdf) { alert("PDF-kirjastot eivät latautuneet. Lataa sivu uudelleen ja yritä uudelleen."); return; }
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1";
  wrapper.innerHTML = `<style>${pdfSheetCss()}</style>${buildKpSheetInner(state.invoices || [], month)}`;
  document.body.appendChild(wrapper);
  try {
    await elementToPdf(wrapper.querySelector("#kpSheet"), `kirjanpito_${month}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
});

// CSV: yhteenvetotilassa rivi per yhtiö × erä × kuukausi × ALV-kanta;
// kuukausitilassa rivi per yhtiö × erä × lasku (yksittäiset laskut eriteltyinä).
registerAction("export-kirjanpito-csv", ({store}) => {
  const state = store.getState();
  const invoices = state.invoices || [];
  const month = state.kirjanpitoMonth || "";
  const year = resolveYear(state);
  const rows = [];

  if (month) {
    for (const [iss, label] of ISSUERS) {
      const issInv = invoices.filter(x => issuerKey(x) === iss);
      const parts = [
        ["Laskutettu", issInv.filter(x => inMonth(x.invoiceDate, month))],
        ["Maksettu", issInv.filter(x => x.paid && inMonth(x.paidDate, month))]
      ];
      for (const [era, list] of parts) {
        for (const inv of list) {
          for (const b of rateBuckets(inv)) {
            rows.push([
              label, era, fmtMonth(month), inv.invoiceNo || "", inv.invoiceDate || "", inv.paidDate || "",
              inv.payerName || "", inv.eventName || "", fmtRate(b.ratePct), csv2(b.net), csv2(b.vat), csv2(b.gross)
            ]);
          }
        }
      }
    }
    downloadCsv(`kirjanpito_${month}_${today()}.csv`,
      ["Yhtiö", "Erä", "Kuukausi", "Laskunro", "Laskun pvm", "Maksupäivä", "Maksaja", "Tapahtuma", "ALV-kanta", "Netto", "ALV", "Brutto"],
      rows);
    return;
  }

  for (const [iss, label] of ISSUERS) {
    const issInv = invoices.filter(x => issuerKey(x) === iss);
    const parts = [
      ["Laskutettu", groupByMonth(issInv, "invoiceDate", year)],
      ["Maksettu", groupByMonth(issInv.filter(x => x.paid), "paidDate", year)]
    ];
    for (const [era, grp] of parts) {
      for (const key of grp.sortedKeys) {
        const mo = grp.months.get(key);
        for (const [rate, r] of [...mo.rates.entries()].sort((a, b) => b[0] - a[0])) {
          rows.push([label, era, key, fmtRate(rate), csv2(r.net), csv2(r.vat), csv2(r.gross)]);
        }
      }
    }
  }
  downloadCsv(`kirjanpito_${year}_${today()}.csv`,
    ["Yhtiö", "Erä", "Kuukausi", "ALV-kanta", "Netto", "ALV", "Brutto"], rows);
});
