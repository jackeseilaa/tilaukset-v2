import {registerAction} from "./dispatch.js";
import {today} from "./format.js";
import {buildTutkintoReport} from "./tutkinnot-report-data.js";

const EXCELJS_URL = "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
const EUR = '#,##0.00 "€"';
const DATE_FMT = "dd.mm.yyyy";
const HEADER_FILL = {type: "pattern", pattern: "solid", fgColor: {argb: "FF0A4272"}};
const TOTAL_FILL = {type: "pattern", pattern: "solid", fgColor: {argb: "FFE5E7EB"}};

// ExcelJS ladataan vasta kun raportti tilataan (iso kirjasto, ei tarvita muuten).
function loadExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = EXCELJS_URL;
    s.onload = () => window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error("ExcelJS puuttuu latauksen jälkeen"));
    s.onerror = () => reject(new Error("ExcelJS-kirjaston lataus epäonnistui"));
    document.head.appendChild(s);
  });
}

// ISO-päivä (YYYY-MM-DD) Excelin päivämääräsoluksi ilman aikavyöhykesiirtymää.
function dateCell(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// cols: [{header, key, width, fmt?, money?}] — rivit objekteja jotka käyttävät samoja avaimia.
function addTable(wb, name, cols, rows, {totalsFor = [], tabColor} = {}) {
  const ws = wb.addWorksheet(name, {views: [{state: "frozen", ySplit: 1}], properties: {tabColor: tabColor ? {argb: tabColor} : undefined}});
  ws.columns = cols.map(c => ({header: c.header, key: c.key, width: c.width || 14, style: c.fmt ? {numFmt: c.fmt} : {}}));
  const head = ws.getRow(1);
  head.height = 30;
  head.eachCell(cell => {
    cell.font = {bold: true, color: {argb: "FFFFFFFF"}};
    cell.fill = HEADER_FILL;
    cell.alignment = {vertical: "middle", wrapText: true};
  });
  for (const r of rows) ws.addRow(r);
  const last = rows.length + 1;
  if (totalsFor.length && rows.length) {
    const tr = ws.addRow({});
    cols.forEach((c, i) => {
      const cell = tr.getCell(i + 1);
      if (i === 0) cell.value = "Yhteensä";
      if (totalsFor.includes(c.key)) {
        const L = ws.getColumn(i + 1).letter;
        cell.value = {formula: `SUM(${L}2:${L}${last})`};
        if (c.fmt) cell.numFmt = c.fmt;
      }
      cell.font = {bold: true};
      cell.fill = TOTAL_FILL;
    });
  }
  if (rows.length) ws.autoFilter = {from: {row: 1, column: 1}, to: {row: last, column: cols.length}};
  return ws;
}

export async function buildTutkintoWorkbook(ExcelJS, state) {
  const rep = buildTutkintoReport(state);
  const wb = new ExcelJS.Workbook();
  wb.creator = "J Sailing — Tilaukset v2";
  wb.created = new Date();

  addTable(wb, "Yhteenveto", [
    {header: "Vuosi", key: "year", width: 8},
    {header: "Tutkinto", key: "type", width: 34},
    {header: "Tilaisuuksia", key: "events", width: 13},
    {header: "Osallistujia", key: "enrolled", width: 13},
    {header: "Vahvistettu", key: "confirmed", width: 13},
    {header: "Maksua odottaa", key: "pending", width: 15},
    {header: "Varapaikka", key: "reserve", width: 12},
    {header: "Laskutettu", key: "billed", width: 14, fmt: EUR},
    {header: "Maksettu", key: "paid", width: 14, fmt: EUR},
    {header: "Avoinna", key: "open", width: 14, fmt: EUR}
  ], rep.summary, {totalsFor: ["events", "enrolled", "confirmed", "pending", "reserve", "billed", "paid", "open"], tabColor: "FF0A4272"});

  addTable(wb, "Tutkinnot", [
    {header: "Päivä", key: "date", width: 12, fmt: DATE_FMT},
    {header: "Tutkinto", key: "type", width: 34},
    {header: "Venetyyppi", key: "boatType", width: 14},
    {header: "Alkaa", key: "startTime", width: 8},
    {header: "Päättyy", key: "endTime", width: 8},
    {header: "Paikka", key: "location", width: 22},
    {header: "Max", key: "max", width: 7},
    {header: "Ilmoittautuneita", key: "enrolled", width: 15},
    {header: "Vahvistettu", key: "confirmed", width: 12},
    {header: "Maksua odottaa", key: "pending", width: 15},
    {header: "Varapaikka", key: "reserve", width: 11},
    {header: "Hinta/hlö", key: "pricePerPerson", width: 12, fmt: EUR},
    {header: "Laskuja", key: "invoiceCount", width: 9},
    {header: "Laskutettu", key: "billed", width: 14, fmt: EUR},
    {header: "Maksettu", key: "paid", width: 14, fmt: EUR},
    {header: "Avoinna", key: "open", width: 14, fmt: EUR},
    {header: "Lisätiedot", key: "notes", width: 40}
  ], rep.events.map(e => ({...e, date: dateCell(e.date), max: e.max || null})),
  {totalsFor: ["enrolled", "confirmed", "pending", "reserve", "invoiceCount", "billed", "paid", "open"], tabColor: "FF166534"});

  addTable(wb, "Osallistujat", [
    {header: "Päivä", key: "date", width: 12, fmt: DATE_FMT},
    {header: "Tutkinto", key: "eventType", width: 34},
    {header: "Venetyyppi", key: "boatType", width: 14},
    {header: "Osallistujan tutkinto", key: "personalType", width: 28},
    {header: "Nimi", key: "name", width: 26},
    {header: "Puhelin", key: "phone", width: 16},
    {header: "Sähköposti", key: "email", width: 30},
    {header: "Status", key: "status", width: 20},
    {header: "Yritys (laskutus)", key: "company", width: 22},
    {header: "Hinta", key: "price", width: 12, fmt: EUR},
    {header: "Laskutettu", key: "billed", width: 14, fmt: EUR},
    {header: "Maksettu", key: "paid", width: 14, fmt: EUR},
    {header: "Avoinna", key: "open", width: 14, fmt: EUR},
    {header: "Laskunumerot", key: "invoiceNos", width: 22},
    {header: "Laskuttaja", key: "issuers", width: 16},
    {header: "Maksupäivä", key: "paidDates", width: 14}
  ], rep.participants.map(p => ({...p, date: dateCell(p.date)})),
  {totalsFor: ["price", "billed", "paid", "open"], tabColor: "FF92400E"});

  return wb;
}

registerAction("export-tutkinnot-xlsx", async ({el, store}) => {
  const state = store.getState();
  if (!state.tutkinnot.length) { alert("Ei tutkintoja, joista raportin voisi tehdä."); return; }
  const label = el?.textContent;
  if (el) { el.disabled = true; el.textContent = "Tehdään raporttia…"; }
  try {
    const ExcelJS = await loadExcelJS();
    const wb = await buildTutkintoWorkbook(ExcelJS, state);
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tutkinnot_raportti_${today()}.xlsx`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (err) {
    console.error("Tutkintoraportti epäonnistui:", err);
    alert("Raportin teko epäonnistui: " + (err?.message || err));
  } finally {
    if (el) { el.disabled = false; el.textContent = label; }
  }
});
