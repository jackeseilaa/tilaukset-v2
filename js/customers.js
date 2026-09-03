import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";

export function custIdentityKey(c) {
  const e = (c.email || "").trim().toLowerCase();
  if (e) return "e:" + e;
  const p = (c.phone || "").replace(/\D/g, "");
  if (p) return "p:" + p;
  return "n:" + (c.name || "").trim().toLowerCase();
}

// Pelkkä nimeen perustuva avain — käytetään yhdistetyn laskun henkilövalinnassa
// custIdentityKeyn sijaan, koska sähköposti/puhelin puuttuu usein osasta
// osallistumistietueista (varsinkin vanhoja) eikä silloin custIdentityKey
// tunnistaisi samaa henkilöä eri purjehduksilla — nimi on se mihin käyttäjä
// joka tapauksessa käytännössä luottaa.
export function custNameKey(c) {
  return (c.name || "").trim().toLowerCase();
}

export function custEventLabel(state, c) {
  if (c.sailingId) {
    const s = state.sailings.find(x => x.id === c.sailingId);
    return s ? (s.name || "Purjehdus") : "(poistettu purjehdus)";
  }
  if (c.tutkintoId) {
    const t = state.tutkinnot.find(x => x.id === c.tutkintoId);
    if (!t) return "(poistettu tutkinto)";
    return c.tutkintoTypeOverride || (t.type || "Tutkinto") + (t.boatType ? " (" + t.boatType + ")" : "");
  }
  return "—";
}

export function custEventDate(state, c) {
  if (c.sailingId) {
    const s = state.sailings.find(x => x.id === c.sailingId);
    return s ? (s.date || "") : "";
  }
  if (c.tutkintoId) {
    const t = state.tutkinnot.find(x => x.id === c.tutkintoId);
    return t ? (t.date || "") : "";
  }
  return "";
}

export function statusBadge(s) {
  if (s === "paid") return `<span class="badge badge-green">✓ Vahvistettu</span>`;
  if (s === "pending") return `<span class="badge badge-red">● Varausmaksu odottaa</span>`;
  if (s === "reserve") return `<span class="badge badge-amber">◎ Varapaikka</span>`;
  return "";
}

// Nimikentän ehdotuslista (datalist) olemassa olevista asiakkaista — ilman
// tätä sama henkilö saa helposti hieman eri kirjoitusasun nimestä uudelle
// purjehdukselle lisättäessä, jolloin custIdentityKey ei enää tunnista
// samaksi henkilöksi (esim. yhdistetty lasku ei löydä kaikkia purjehduksia).
export function custNameSuggestions(state) {
  return [...new Set(state.customers.map(c => (c.name || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function emptyCustomerDraft(sailingId, tutkintoId) {
  return {name: "", phone: "", email: "", sailingId: sailingId || "", tutkintoId: tutkintoId || "", tutkintoTypeOverride: "", billTo: "self", companyId: "", reservationStatus: "pending", laskutusosio: "", priceOverride: ""};
}

function draftFromCustomer(c) {
  return {
    name: c.name || "", phone: c.phone || "", email: c.email || "",
    sailingId: c.sailingId || "", tutkintoId: c.tutkintoId || "", tutkintoTypeOverride: c.tutkintoTypeOverride || "",
    billTo: c.billTo || "self", companyId: c.companyId || "",
    reservationStatus: c.reservationStatus || "pending", laskutusosio: c.laskutusosio || "",
    priceOverride: c.priceOverride != null ? String(c.priceOverride) : ""
  };
}

registerAction("new-customer", ({id, type, store}) => {
  const forTutkinto = type === "tutkinto";
  store.setState({modal: "customer", editId: null, customerDraft: emptyCustomerDraft(forTutkinto ? "" : (id || ""), forTutkinto ? (id || "") : "")});
});

registerAction("edit-customer", ({id, store}) => {
  const c = store.getState().customers.find(x => x.id === id);
  if (!c) return;
  store.setState({modal: "customer", editId: id, customerDraft: draftFromCustomer(c)});
});

registerAction("save-customer", async ({store}) => {
  const state = store.getState();
  const d = state.customerDraft || {};
  const name = (d.name || "").trim();
  if (!name) { alert("Nimi on pakollinen."); return; }
  const billTo = d.billTo || "self";
  if (billTo === "company" && !d.companyId) { alert("Valitse tilaajayritys."); return; }
  const priceOverrideRaw = d.priceOverride ?? "";
  const priceOverride = priceOverrideRaw !== "" ? parseFloat(priceOverrideRaw) : null;
  // Purjehdus ja tutkinto ovat toisensa poissulkevia — jos molemmat valittu, purjehdus voittaa.
  const sailingId = d.sailingId || "";
  const tutkintoId = sailingId ? "" : (d.tutkintoId || "");
  const data = {
    name, phone: (d.phone || "").trim(), email: (d.email || "").trim(),
    sailingId, tutkintoId, tutkintoTypeOverride: tutkintoId ? (d.tutkintoTypeOverride || "") : "",
    billTo, companyId: billTo === "company" ? d.companyId : "",
    reservationStatus: d.reservationStatus || "pending",
    laskutusosio: (d.laskutusosio || "").trim(),
    priceOverride
  };
  if (state.editId) await fsSet("customers", state.editId, data, store);
  else await fsAdd("customers", data, store);
  store.setState({modal: null, editId: null, customerDraft: null});
});

// Kun nimi täsmää olemassa olevaan asiakkaaseen (datalist-ehdotus valittu tai
// kirjoitettu käsin), täydennetään puhelin/sähköposti automaattisesti — mutta
// vain jos ne ovat vielä tyhjät, ettei käsin muokattu tieto ylikirjoitu.
registerAction("customer-name-picked", ({store}) => {
  const state = store.getState();
  const d = state.customerDraft;
  if (!d || d.phone || d.email) return;
  const name = (d.name || "").trim().toLowerCase();
  if (!name) return;
  const match = state.customers.find(c => (c.name || "").trim().toLowerCase() === name && (c.phone || c.email));
  if (!match) return;
  store.setState({customerDraft: {...d, phone: match.phone || d.phone, email: match.email || d.email}});
});

// Henkilön yhteystietojen kertamuokkaus (owner 2026-09-03: "tämä paikka olisi
// looginen asiakastietojen muuttamiselle" — Asiakkaat-haku näytti henkilön
// mutta ei tarjonnut suoraa tapaa muokata yhteystietoja ilman että avaa
// jonkin yksittäisen purjehdusosallistumisen kautta). Kootaan nykyiset
// tiedot kaikista henkilön osallistumistietueista samalla logiikalla kuin
// customers-view.js:n ryhmittely.
registerAction("edit-person", ({id, store}) => {
  const state = store.getState();
  const key = id;
  const items = state.customers.filter(c => custIdentityKey(c) === key);
  if (items.length === 0) return;
  let name = "", phone = "", email = "";
  for (const c of items) {
    if (c.name && c.name.length > name.length) name = c.name;
    if (!email && c.email) email = c.email;
    if (!phone && c.phone) phone = c.phone;
  }
  store.setState({modal: "person", personEditKey: key, personDraft: {name, phone, email}});
});

// Kirjoittaa nimen/puhelimen/sähköpostin KAIKKIIN henkilön osallistumis-
// tietueisiin kerralla (fsSet mergeaa, muut kentät per tietue säilyvät
// koskemattomina). Tämä myös korjaa custIdentityKey-ryhmittelyn kerralla
// jos jotain osallistumista puuttui yhteystieto (ks. yhdistetty lasku).
registerAction("save-person", async ({store}) => {
  const state = store.getState();
  const d = state.personDraft || {};
  const name = (d.name || "").trim();
  if (!name) { alert("Nimi on pakollinen."); return; }
  const phone = (d.phone || "").trim();
  const email = (d.email || "").trim();
  const key = state.personEditKey;
  const items = state.customers.filter(c => custIdentityKey(c) === key);
  await Promise.all(items.map(c => fsSet("customers", c.id, {name, phone, email}, store)));
  store.setState({modal: null, personEditKey: null, personDraft: null});
});

registerAction("delete-customer", async ({id, store}) => {
  if (!confirm("Poistetaanko asiakas?")) return;
  await fsDel("customers", id, store);
});

registerAction("confirm-payment", async ({id, store}) => {
  const c = store.getState().customers.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`Merkitäänkö ${c.name} varausmaksu suoritetuksi?`)) return;
  await fsSet("customers", id, {reservationStatus: "paid"}, store);
});

registerAction("toggle-person", ({el, store}) => {
  const key = el.dataset.id;
  const state = store.getState();
  store.setState({expandedPerson: state.expandedPerson === key ? null : key});
});
