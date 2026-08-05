import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";

export function custIdentityKey(c) {
  const e = (c.email || "").trim().toLowerCase();
  if (e) return "e:" + e;
  const p = (c.phone || "").replace(/\D/g, "");
  if (p) return "p:" + p;
  return "n:" + (c.name || "").trim().toLowerCase();
}

export function custEventLabel(state, c) {
  if (c.sailingId) {
    const s = state.sailings.find(x => x.id === c.sailingId);
    return s ? (s.name || "Purjehdus") : "(poistettu purjehdus)";
  }
  if (c.tutkintoId) {
    const t = state.tutkinnot.find(x => x.id === c.tutkintoId);
    return t ? (t.type || "Tutkinto") + (t.boatType ? " (" + t.boatType + ")" : "") : "(poistettu tutkinto)";
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

export function emptyCustomerDraft(sailingId, tutkintoId) {
  return {name: "", phone: "", email: "", sailingId: sailingId || "", tutkintoId: tutkintoId || "", billTo: "self", companyId: "", reservationStatus: "pending", laskutusosio: "", priceOverride: ""};
}

function draftFromCustomer(c) {
  return {
    name: c.name || "", phone: c.phone || "", email: c.email || "",
    sailingId: c.sailingId || "", tutkintoId: c.tutkintoId || "", billTo: c.billTo || "self", companyId: c.companyId || "",
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
    sailingId, tutkintoId, billTo,
    companyId: billTo === "company" ? d.companyId : "",
    reservationStatus: d.reservationStatus || "pending",
    laskutusosio: (d.laskutusosio || "").trim(),
    priceOverride
  };
  if (state.editId) await fsSet("customers", state.editId, data, store);
  else await fsAdd("customers", data, store);
  store.setState({modal: null, editId: null, customerDraft: null});
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
