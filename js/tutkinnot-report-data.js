// Tutkintoraportin datan rakennus — puhdas funktio ilman DOM/Firebase-riippuvuuksia,
// jotta sen voi testata Node:lla. Excel-tiedoston kirjoitus on tutkinnot-report.js:ssä.

export const STATUS_LABELS = {paid: "Vahvistettu", pending: "Varausmaksu odottaa", reserve: "Varapaikka"};
export const INV_TYPE_NAMES = {full: "Lasku", reservation: "Varausmaksu", partial: "Osasuoritus", credit: "Hyvityslasku"};

const G = x => Number(x?.grossTotal || 0);
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// Tutkintoon liittyvät laskut: source "tutkinto" + eventId. Hyvityslaskut ovat
// negatiivisia, joten summat ovat samalla logiikalla kuin Reskontrassa
// (laskutettu = kaikki yhteensä, maksettu = maksetuksi merkityt, avoinna = erotus).
function invoiceSums(list) {
  const billed = list.reduce((s, x) => s + G(x), 0);
  const paid = list.filter(x => x.paid).reduce((s, x) => s + G(x), 0);
  return {billed: round2(billed), paid: round2(paid), open: round2(billed - paid)};
}

export function buildTutkintoReport(state) {
  const tutkinnot = (state.tutkinnot || []).slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const customers = state.customers || [];
  const invoices = (state.invoices || []).filter(x => x.source === "tutkinto");
  const companyName = c => c.billTo === "company" ? ((state.companies || []).find(co => co.id === c.companyId)?.name || "") : "";

  const events = [];
  const participants = [];

  for (const t of tutkinnot) {
    const atts = customers.filter(c => c.tutkintoId === t.id)
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "fi"));
    const evInvoices = invoices.filter(x => x.eventId === t.id);
    const count = st => atts.filter(c => (c.reservationStatus || "pending") === st).length;
    const sums = invoiceSums(evInvoices);

    events.push({
      id: t.id, date: t.date || "", year: (t.date || "").slice(0, 4), type: t.type || "",
      boatType: t.boatType || "", startTime: t.startTime || "", endTime: t.endTime || "",
      location: t.location || "", max: Number(t.maxPersons || 0), enrolled: atts.length,
      confirmed: count("paid"), pending: count("pending"), reserve: count("reserve"),
      pricePerPerson: Number(t.pricePerPerson || 0),
      billed: sums.billed, paid: sums.paid, open: sums.open,
      invoiceCount: evInvoices.length, notes: t.notes || ""
    });

    for (const c of atts) {
      const cInv = evInvoices.filter(x => x.customerId === c.id || (x.coveredCustomerIds || []).includes(c.id));
      const s = invoiceSums(cInv);
      const listPrice = (c.priceOverride != null && c.priceOverride !== "") ? Number(c.priceOverride) : Number(t.pricePerPerson || 0);
      participants.push({
        date: t.date || "", eventType: t.type || "", boatType: t.boatType || "",
        personalType: c.tutkintoTypeOverride || "",
        name: c.name || "", phone: c.phone || "", email: c.email || "",
        status: STATUS_LABELS[c.reservationStatus || "pending"] || (c.reservationStatus || ""),
        company: companyName(c), price: listPrice,
        billed: s.billed, paid: s.paid, open: s.open,
        invoiceNos: cInv.map(x => x.invoiceNo).filter(Boolean).join(", "),
        issuers: [...new Set(cInv.map(x => x.issuerName).filter(Boolean))].join(", "),
        paidDates: cInv.filter(x => x.paid && x.paidDate).map(x => x.paidDate).sort().join(", ")
      });
    }
  }

  // Yhteenveto vuosi + tutkintotyyppi
  const groups = new Map();
  for (const e of events) {
    const key = e.year + "|" + e.type;
    if (!groups.has(key)) groups.set(key, {year: e.year, type: e.type, events: 0, enrolled: 0, confirmed: 0, pending: 0, reserve: 0, billed: 0, paid: 0, open: 0});
    const g = groups.get(key);
    g.events += 1; g.enrolled += e.enrolled; g.confirmed += e.confirmed; g.pending += e.pending; g.reserve += e.reserve;
    g.billed = round2(g.billed + e.billed); g.paid = round2(g.paid + e.paid); g.open = round2(g.open + e.open);
  }
  const summary = [...groups.values()].sort((a, b) => b.year.localeCompare(a.year) || a.type.localeCompare(b.type, "fi"));

  const totals = summary.reduce((t, g) => {
    for (const k of ["events", "enrolled", "confirmed", "pending", "reserve"]) t[k] += g[k];
    for (const k of ["billed", "paid", "open"]) t[k] = round2(t[k] + g[k]);
    return t;
  }, {events: 0, enrolled: 0, confirmed: 0, pending: 0, reserve: 0, billed: 0, paid: 0, open: 0});

  return {summary, totals, events, participants};
}
