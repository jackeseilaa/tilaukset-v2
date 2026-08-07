import {esc, fmtDate, addDays} from "./format.js";
import {ISSUERS} from "./state.js";
import {registerAction} from "./dispatch.js";

// Suomalainen virtuaaliviivakoodi (pankkien mobiilisovellukset lukevat sen
// suoraan maksuksi) — sama muoto kuin vanhassa sovelluksessa.
function buildFinnishBarcode(iban, amountEur, reference, dueDateYYMMDD) {
  const d = iban.replace(/\s/g, "").slice(2);
  const c = String(Math.round(amountEur * 100)).padStart(8, "0");
  const r = reference.replace(/\D/g, "").padStart(20, "0");
  return "4" + d + c + "000" + r + (dueDateYYMMDD || "000000");
}

function yymmdd(s) {
  if (!s) return "000000";
  const [y, m, d] = s.split("-");
  return y.slice(2) + m + d;
}

function invoiceTitle(inv) {
  if (inv.isCredit) return "HYVITYSLASKU";
  if (inv.itype === "reservation") return "LASKU — VARAUSMAKSU";
  if (inv.itype === "partial") return "LASKU — OSASUORITUS";
  return "LASKU — LOPPULASKU";
}

// Vanhat (ennen V1.7.0) laskut eivät tallentaneet vatBreakdown-kenttää —
// niille rakennetaan yhden kannan yhteenveto vatRatePct/vat-kentistä.
function vatRows(inv) {
  const bd = Array.isArray(inv.vatBreakdown) && inv.vatBreakdown.length
    ? inv.vatBreakdown
    : [{ratePct: inv.vatRatePct ?? 25.5, vat: Number(inv.vat || 0)}];
  return bd.map(b => `<tr><td style="padding:2px 8px;color:#555">ALV ${b.ratePct}%</td><td style="padding:2px 8px;text-align:right">${Number(b.vat || 0).toFixed(2)} €</td></tr>`).join("");
}

// Rakentaa tulostettavan laskun HTML:n rasterointia varten (html2canvas).
// Palauttaa myös viivakoodin arvon erikseen, koska JsBarcode piirtää sen
// vasta kun sheet on liitetty DOM:iin.
function buildInvoiceSheetHtml(inv) {
  const I = ISSUERS[inv.issuer || "tmi"] || ISSUERS.tmi;
  const iDate = inv.invoiceDate || "";
  const pd = inv.paymentDays != null ? Number(inv.paymentDays) : 7;
  const due = iDate ? (pd === 0 ? iDate : addDays(iDate, pd)) : "";
  const gross = Number(inv.grossTotal || 0);
  const isC = !!inv.isCredit || gross < 0;
  const barcodeValue = (!isC && due && inv.reference) ? buildFinnishBarcode(I.iban, Math.abs(gross), inv.reference, yymmdd(due)) : null;
  const lines = Array.isArray(inv.lines) ? inv.lines : [];
  const thStyle = "font-size:9px;text-transform:uppercase;letter-spacing:.4px;color:#555;font-weight:700;padding:5px 8px;background:#f8fafc;border-bottom:2px solid #cbd5e1;text-align:";
  const rows = lines.map(l => `<tr>
    <td style="padding:4px 8px;border-bottom:1px solid #e8eaed;font-size:10.5px">${esc(l.title || "")}</td>
    <td style="padding:4px 8px;border-bottom:1px solid #e8eaed;font-size:10.5px;text-align:center;width:36px">${esc(String(l.qty ?? 1))}</td>
    <td style="padding:4px 8px;border-bottom:1px solid #e8eaed;font-size:10.5px;text-align:right;width:80px">${Number(l.unit || 0).toFixed(2)}</td>
    <td style="padding:4px 8px;border-bottom:1px solid #e8eaed;font-size:10.5px;text-align:right;width:80px;font-weight:${Number(l.total || 0) < 0 ? 700 : 400};color:${Number(l.total || 0) < 0 ? "#b91c1c" : "#111"}">${Number(l.total || 0).toFixed(2)}</td>
  </tr>`).join("");

  const html = `<div id="pdfSheet" style="width:794px;padding:60px 68px 50px;background:#fff;font-family:'Helvetica Neue',Arial,Helvetica,sans-serif;font-size:11px;color:#1a1a1a">
    <table style="width:100%;margin-bottom:14px"><tr>
      <td style="vertical-align:top;width:52%">
        <div style="font-size:17px;font-weight:700;color:#0a4272;margin-bottom:5px">${esc(I.name)}</div>
        <div style="font-size:10px;color:#555;line-height:1.9">${esc(I.address)}<br>Y-tunnus: <strong>${esc(I.businessId)}</strong></div>
      </td>
      <td style="vertical-align:top;text-align:right">
        <h1 style="font-size:26px;font-weight:700;letter-spacing:-.5px;color:${isC ? "#b91c1c" : "#0a4272"};margin-bottom:10px">${invoiceTitle(inv)}</h1>
        <table style="margin-left:auto;border-collapse:collapse;font-size:10.5px">
          <tr><td style="color:#888;padding:2px 10px 2px 0;text-align:right">Laskunumero</td><td style="font-weight:700;font-size:14px">${esc(inv.invoiceNo || "")}</td></tr>
          <tr><td style="color:#888;padding:2px 10px 2px 0;text-align:right">Laskupäivä</td><td>${fmtDate(iDate)}</td></tr>
          <tr><td style="color:#888;padding:2px 10px 2px 0;text-align:right">Maksuehto</td><td>${pd === 0 ? "Heti" : pd + " vrk netto"}</td></tr>
          ${!isC ? `<tr><td style="color:#888;padding:2px 10px 2px 0;text-align:right">Eräpäivä</td><td style="font-weight:700;color:#b91c1c">${fmtDate(due)}</td></tr>` : ""}
          <tr><td style="color:#888;padding:2px 10px 2px 0;text-align:right">Viitenumero</td><td style="font-weight:700;font-size:13px;letter-spacing:.5px">${esc(inv.reference || "")}</td></tr>
        </table>
      </td>
    </tr></table>
    <div style="border-top:2px solid #0a4272;margin-bottom:12px"></div>
    <div style="margin-bottom:14px">
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-bottom:2px">Laskutetaan</div>
      <div style="font-size:14px;font-weight:700;margin-bottom:2px">${esc(inv.payerName || "—")}</div>
      ${inv.payerBusinessId ? `<div style="font-size:10px;color:#555">Y-tunnus: ${esc(inv.payerBusinessId)}</div>` : ""}
      ${inv.payerEmail ? `<div style="font-size:10px;color:#2563eb">${esc(inv.payerEmail)}</div>` : ""}
      ${inv.note ? `<div style="margin-top:6px;font-size:10.5px;color:#374151"><strong>Huomautus:</strong> ${esc(inv.note)}</div>` : ""}
    </div>
    <div style="border-top:1px solid #e2e8f0;margin-bottom:10px"></div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
      <thead><tr>
        <th style="${thStyle}left">Kuvaus</th>
        <th style="${thStyle}right;width:36px">Kpl</th>
        <th style="${thStyle}right;width:80px">Á-hinta €</th>
        <th style="${thStyle}right;width:80px">Yhteensä €</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table style="width:220px;margin-left:auto;margin-top:8px;border-collapse:collapse;font-size:10.5px">
      <tr><td style="padding:2px 8px;color:#555">Veroton</td><td style="padding:2px 8px;text-align:right">${Number(inv.net || 0).toFixed(2)} €</td></tr>
      ${vatRows(inv)}
      <tr style="border-top:2px solid #1a1a1a">
        <td style="padding:5px 8px;font-weight:700;font-size:12px;white-space:nowrap">Maksettava yhteensä</td>
        <td style="padding:5px 8px;text-align:right;font-weight:700;font-size:15px;color:${isC ? "#b91c1c" : "#0a4272"};white-space:nowrap">${Math.abs(gross).toFixed(2)} €</td>
      </tr>
    </table>
    ${barcodeValue ? `
    <div style="border-top:1px solid #cbd5e1;margin:20px 0 12px"></div>
    <div style="font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-bottom:8px">Maksutiedot</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #cbd5e1;font-size:10.5px">
      <thead><tr style="background:#f8fafc">
        <th style="padding:5px 10px;text-align:left;font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.4px;width:28%;border-bottom:1px solid #e2e8f0">Saajan nimi</th>
        <th style="padding:5px 10px;text-align:left;font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.4px;width:28%;border-bottom:1px solid #e2e8f0">Tilinumero (IBAN) / BIC</th>
        <th style="padding:5px 10px;text-align:left;font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.4px;width:18%;border-bottom:1px solid #e2e8f0">Viitenumero</th>
        <th style="padding:5px 10px;text-align:left;font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.4px;width:13%;border-bottom:1px solid #e2e8f0">Eräpäivä</th>
        <th style="padding:5px 10px;text-align:right;font-size:9px;color:#555;font-weight:700;text-transform:uppercase;letter-spacing:.4px;width:13%;border-bottom:1px solid #e2e8f0">Summa €</th>
      </tr></thead>
      <tbody><tr>
        <td style="padding:7px 10px;font-weight:600">${esc(I.name)}</td>
        <td style="padding:7px 10px"><span style="font-weight:600;display:block">${esc(I.iban)}</span><span style="color:#666;font-size:9.5px">${esc(I.bic)}</span></td>
        <td style="padding:7px 10px;font-weight:700;font-size:12px;letter-spacing:.3px">${esc(inv.reference || "")}</td>
        <td style="padding:7px 10px;font-weight:700;color:#b91c1c">${fmtDate(due)}</td>
        <td style="padding:7px 10px;font-weight:700;font-size:14px;color:#0a4272;text-align:right">${Math.abs(gross).toFixed(2)}</td>
      </tr></tbody>
    </table>
    <div style="margin-top:10px">
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:.6px;color:#888;margin-bottom:4px">Virtuaaliviivakoodinumero</div>
      <svg id="pdfBarcode"></svg>
      <div style="font-family:'Courier New',monospace;font-size:9px;color:#555;letter-spacing:.5px;margin-top:3px">${esc(barcodeValue)}</div>
    </div>` : ""}
  </div>`;
  return {html, barcodeValue};
}

// Yhteinen runko download- ja emaililiite-käyttötapauksille — rakentaa ja
// palauttaa jsPDF-dokumentin, kutsuja päättää mitä sillä tehdään (.save() /
// .output()). Heittää jos kirjastot eivät ole latautuneet.
async function generateInvoicePdfDoc(inv) {
  if (!window.html2canvas || !window.jspdf) throw new Error("PDF-kirjastot eivät latautuneet. Tarkista internetyhteys ja lataa sivu uudelleen.");
  const {html, barcodeValue} = buildInvoiceSheetHtml(inv);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1";
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
  try {
    if (barcodeValue && window.JsBarcode) {
      const barEl = wrapper.querySelector("#pdfBarcode");
      try { window.JsBarcode(barEl, barcodeValue, {format: "CODE128", width: 1.5, height: 44, displayValue: false, margin: 0}); } catch {}
    }
    const sheet = wrapper.querySelector("#pdfSheet");
    const canvas = await window.html2canvas(sheet, {scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false});
    const {jsPDF} = window.jspdf;
    const pdf = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});
    const iw = 210, ih = (canvas.height * iw) / canvas.width;
    if (ih <= 297) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, iw, ih);
    } else {
      // Useampisivuinen laskutus (paljon rivejä) — leikataan canvas A4-korkuisiin
      // paloihin ja lisätään jokainen omalle sivulleen.
      let y = 0;
      while (y < canvas.height) {
        const ph = Math.min(297 * (canvas.width / iw), canvas.height - y);
        const tc = document.createElement("canvas");
        tc.width = canvas.width; tc.height = ph;
        tc.getContext("2d").drawImage(canvas, 0, y, canvas.width, ph, 0, 0, canvas.width, ph);
        if (y > 0) pdf.addPage();
        pdf.addImage(tc.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, iw, ph * (iw / canvas.width));
        y += ph;
      }
    }
    return pdf;
  } finally {
    document.body.removeChild(wrapper);
  }
}

export async function downloadInvoicePdf(inv) {
  try {
    const pdf = await generateInvoicePdfDoc(inv);
    pdf.save(`${(inv.invoiceNo || "lasku").replace(/[^\w.-]/g, "_")}.pdf`);
  } catch (err) {
    alert(err.message || "PDF:n luonti epäonnistui.");
  }
}

// Sähköpostiliitteeksi — ei omaa virheenkäsittelyä, kutsujan (email.js) pitää
// näyttää oma virheilmoituksensa lähetyksen kontekstissa.
export async function getInvoicePdfBase64(inv) {
  const pdf = await generateInvoicePdfDoc(inv);
  const dataUri = pdf.output("datauristring");
  return dataUri.split(",")[1] || "";
}

registerAction("download-invoice-pdf", async ({id, store}) => {
  const inv = store.getState().invoices.find(x => x.id === id);
  if (!inv) return;
  await downloadInvoicePdf(inv);
});
