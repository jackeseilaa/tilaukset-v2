import {runTransaction, doc} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {db} from "./firebase.js";
import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today} from "./format.js";
import {vatFromGross} from "./vat.js";
import {isIntlSailing} from "./sailings.js";
import {ISSUERS} from "./state.js";

export const INV_TYPE_LABELS = {full: "Lasku", reservation: "Varausmaksu", partial: "Osasuoritus", credit: "Hyvityslasku"};

export function finnishReference(digits) {
  digits = String(digits || "").replace(/\D/g, "");
  if (!digits) return "";
  const w = [7, 3, 1];
  let sum = 0, wi = 0;
  for (let i = digits.length - 1; i >= 0; i--) { sum += Number(digits[i]) * w[wi % 3]; wi++; }
  return digits + String((10 - (sum % 10)) % 10);
}

// Nopea, ei-autoritatiivinen esikatselunumero lomakkeen live-esikatseluun
// (skannaa paikallisen state.invoices-taulukon — sama tapa kuin vanhassa
// sovelluksessa). Todellinen numero haetaan vasta tallennushetkellä
// allocateInvoiceNumber()-funktiolla, joka käyttää Firestore-transaktiota
// estämään kahden lähes samanaikaisen laskun päätymisen samaan numeroon
// (riski jota vanhassa sovelluksessa ei ollut suojattu).
export function previewNextInvoiceNumber(state) {
  const year = new Date().getFullYear();
  let max = 0;
  for (const inv of state.invoices) {
    const m = String(inv.invoiceNo || "").match(/^JS-(\d{4})-(\d+)$/);
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return `JS-${year}-${String(max + 1).padStart(3, "0")}`;
}

export async function allocateInvoiceNumber() {
  const year = new Date().getFullYear();
  const counterRef = doc(db, "meta", "invoiceCounter");
  const num = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const data = snap.exists() ? snap.data() : {};
    const next = Number(data[String(year)] || 0) + 1;
    tx.set(counterRef, {...data, [String(year)]: next}, {merge: true});
    return next;
  });
  return `JS-${year}-${String(num).padStart(3, "0")}`;
}

export function emptyInvoiceDraft(issuer) {
  return {issuer: issuer || "tmi", sailingId: "", mode: "customer", type: "full", invoiceDate: today(), customerId: "", companyId: "", partialAmount: "", creditRefId: "", note: ""};
}

function alreadyInvoicedReservationFee(state, sailingId, payerName) {
  return state.invoices
    .filter(x => x.eventId === sailingId && x.itype === "reservation" && x.payerName === payerName)
    .reduce((sum, x) => sum + Number(x.grossTotal || 0), 0);
}

// Laskee laskun rivit/summat annetusta luonnoksesta. Puhdas funktio —
// ei kirjoita mitään, käytetään sekä live-esikatseluun että tallennukseen.
// Vain purjehduspohjaiset laskut (ei tutkinto- eikä tuotepohjaisia — ne
// odottavat tutkinnot-domainia, ks. muistio).
export function computeInvoice(state, draft) {
  const s = state.sailings.find(x => x.id === draft.sailingId) || null;
  const itype = draft.type || "full";
  const isCredit = itype === "credit", isPartial = itype === "partial", isReservation = itype === "reservation";
  const creditRef = isCredit ? state.invoices.find(x => x.id === draft.creditRefId) : null;

  const isCharter = s?.type === "Charter";
  const isInternational = isIntlSailing(s);
  let ratePct = isInternational ? 0 : isCharter ? 13.5 : 25.5;
  if (isCredit && creditRef) ratePct = Number(creditRef.vatRatePct ?? ratePct);

  let payerName = "", payerEmail = "", payerBusinessId = "", lines = [], grossTotal = 0;
  const eventName = s?.name || "";

  if (isCredit) {
    if (creditRef) {
      payerName = creditRef.payerName || ""; payerEmail = creditRef.payerEmail || ""; payerBusinessId = creditRef.payerBusinessId || "";
      const amt = -Math.abs(Number(creditRef.grossTotal || 0));
      lines = [{title: `Hyvitys laskulle ${creditRef.invoiceNo}`, qty: 1, unit: amt, total: amt}];
      grossTotal = amt;
    }
  } else if (s) {
    let price = isReservation ? Number(s.reservationFee || 0) : Number(s.pricePerPerson || 0);
    if (isPartial || (isReservation && !Number(s.reservationFee || 0))) price = parseFloat(draft.partialAmount || 0) || 0;

    if (draft.mode === "customer" || draft.mode === "customer-company") {
      const c = state.customers.find(x => x.id === draft.customerId);
      if (c) {
        if (draft.mode === "customer-company") {
          const co = state.companies.find(x => x.id === draft.companyId);
          payerName = co?.name || c.name || ""; payerEmail = co?.email || c.email || ""; payerBusinessId = co?.businessId || "";
        } else {
          payerName = c.name || ""; payerEmail = c.email || "";
        }
        const effectivePrice = (c.priceOverride != null && c.priceOverride !== "") ? Number(c.priceOverride) : price;
        const priceNote = (c.priceOverride != null && c.priceOverride !== "") ? " (yksilöllinen hinta)" : "";
        lines.push({title: `${s.name} — ${INV_TYPE_LABELS[itype]} — ${c.name}${priceNote}`, qty: 1, unit: effectivePrice, total: effectivePrice});
        grossTotal = effectivePrice;
        const alreadyFee = (itype === "full") ? alreadyInvoicedReservationFee(state, s.id, payerName) : 0;
        if (alreadyFee > 0) {
          lines.push({title: "Aiemmin laskutettu varausmaksu", qty: 1, unit: -alreadyFee, total: -alreadyFee});
          grossTotal -= alreadyFee;
        }
        if (draft.mode === "customer-company") {
          const co = state.companies.find(x => x.id === draft.companyId);
          const comm = Math.abs(grossTotal) * (Number(co?.commissionPct || 0) / 100);
          if (comm > 0) { lines.push({title: "Välitysprovisio", qty: 1, unit: -comm, total: -comm}); grossTotal -= comm; }
        }
      }
    } else {
      const co = state.companies.find(x => x.id === draft.companyId);
      if (co) {
        payerName = co.name || ""; payerEmail = co.email || ""; payerBusinessId = co.businessId || "";
        const cust = state.customers.filter(c => c.sailingId === s.id && c.billTo === "company" && c.companyId === co.id).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        let gross = isPartial ? price : cust.length * price;
        if (isPartial) lines.push({title: `${s.name} — Osasuoritus`, qty: 1, unit: price, total: price});
        else for (const c of cust) lines.push({title: `${s.name} — ${INV_TYPE_LABELS[itype]} — ${c.name}`, qty: 1, unit: price, total: price});
        const alreadyFee = (itype === "full") ? alreadyInvoicedReservationFee(state, s.id, payerName) : 0;
        if (alreadyFee > 0) {
          lines.push({title: "Aiemmin laskutettu varausmaksu", qty: 1, unit: -alreadyFee, total: -alreadyFee});
          gross -= alreadyFee;
        }
        const comm = Math.abs(gross) * (Number(co.commissionPct || 0) / 100);
        if (comm > 0) lines.push({title: "Välitysprovisio", qty: 1, unit: -comm, total: -comm});
        grossTotal = gross - comm;
      }
    }
  }

  const {net, vat} = vatFromGross(grossTotal, ratePct);
  const invNoPreview = previewNextInvoiceNumber(state);
  const reference = finnishReference(invNoPreview.replace(/\D/g, ""));
  return {sailing: s, ratePct, payerName, payerEmail, payerBusinessId, lines, grossTotal, net, vat, reference, invNoPreview, eventName, itype, isCredit, isPartial, isReservation, creditRef};
}

registerAction("new-invoice", ({store}) => {
  const state = store.getState();
  store.setState({tab: "invoicing", editInvoiceId: null, invoiceDraft: emptyInvoiceDraft(state.invoiceDraft?.issuer)});
});

registerAction("edit-invoice", ({id, store}) => {
  const state = store.getState();
  const inv = state.invoices.find(x => x.id === id);
  if (!inv) return;
  const companyId = (inv.mode === "company" || inv.mode === "customer-company")
    ? (state.companies.find(co => co.name === inv.payerName)?.id || "") : "";
  store.setState({
    tab: "invoicing",
    editInvoiceId: id,
    invoiceDraft: {
      issuer: inv.issuer || "tmi", sailingId: inv.eventId || "", mode: inv.mode || "customer",
      type: inv.itype || "full", invoiceDate: inv.invoiceDate || today(),
      customerId: inv.customerId || "", companyId,
      partialAmount: (inv.itype === "partial" || inv.itype === "reservation") ? String(inv.grossTotal ?? "") : "",
      creditRefId: inv.creditRefId || "", note: inv.note || ""
    }
  });
});

registerAction("new-credit-note", ({id, store}) => {
  const state = store.getState();
  const inv = state.invoices.find(x => x.id === id);
  if (!inv) return;
  store.setState({
    tab: "invoicing",
    editInvoiceId: null,
    invoiceDraft: {
      issuer: inv.issuer || "tmi", sailingId: inv.eventId || "", mode: inv.mode || "customer",
      type: "credit", invoiceDate: today(), customerId: inv.customerId || "", companyId: "",
      partialAmount: "", creditRefId: id, note: ""
    }
  });
});

registerAction("cancel-edit-invoice", ({store}) => {
  const state = store.getState();
  store.setState({editInvoiceId: null, invoiceDraft: emptyInvoiceDraft(state.invoiceDraft?.issuer)});
});

registerAction("save-invoice", async ({store}) => {
  const state = store.getState();
  const d = state.invoiceDraft;
  const inv = computeInvoice(state, d);
  if (!inv.isCredit && !inv.sailing) { alert("Valitse tapahtuma."); return; }
  if (d.mode === "company" && !d.companyId) { alert("Valitse yritys."); return; }
  if (!inv.payerName) { alert("Valitse asiakas."); return; }
  if (inv.lines.length === 0) { alert("Laskulla ei ole rivejä."); return; }
  if (inv.isCredit && !d.creditRefId) { alert("Valitse hyvitettävä lasku."); return; }
  if (inv.isPartial && !parseFloat(d.partialAmount || 0)) { alert("Syötä osasuorituksen summa."); return; }

  const editingId = state.editInvoiceId;
  const existing = editingId ? state.invoices.find(x => x.id === editingId) : null;
  let invoiceNo, reference;
  if (existing) { invoiceNo = existing.invoiceNo; reference = existing.reference; }
  else { invoiceNo = await allocateInvoiceNumber(); reference = finnishReference(invoiceNo.replace(/\D/g, "")); }

  const issuerInfo = ISSUERS[d.issuer || "tmi"] || ISSUERS.tmi;
  const rec = {
    issuer: d.issuer || "tmi", issuerName: issuerInfo.name,
    mode: d.mode, itype: inv.itype, isCredit: !!inv.isCredit,
    creditRefId: d.creditRefId || "", creditRefNo: inv.creditRef?.invoiceNo || "",
    invoiceNo, invoiceDate: d.invoiceDate || today(), reference,
    payerName: inv.payerName, payerBusinessId: inv.payerBusinessId || "", payerEmail: inv.payerEmail || "",
    eventId: inv.sailing?.id || "", eventName: inv.eventName,
    vatRatePct: inv.ratePct, net: Number(inv.net || 0), vat: Number(inv.vat || 0), grossTotal: Number(inv.grossTotal || 0),
    lines: inv.lines, paid: existing?.paid || false, paidDate: existing?.paidDate || "",
    coveredCustomerIds: (d.mode === "customer" || d.mode === "customer-company") ? [d.customerId] : [],
    customerId: d.customerId || "", note: (d.note || "").trim()
  };
  if (existing) await fsSet("invoices", editingId, rec, store);
  else await fsAdd("invoices", rec, store);
  alert(`Tallennettu!\nLaskunro: ${invoiceNo}\nViite: ${reference}`);
  store.setState({editInvoiceId: null, invoiceDraft: emptyInvoiceDraft(d.issuer)});
});

registerAction("delete-invoice", async ({id, store}) => {
  if (!confirm("Poistetaanko lasku?")) return;
  await fsDel("invoices", id, store);
});

registerAction("toggle-paid", async ({id, store}) => {
  const inv = store.getState().invoices.find(x => x.id === id);
  if (!inv) return;
  await fsSet("invoices", id, {paid: !inv.paid, paidDate: !inv.paid ? today() : ""}, store);
});
