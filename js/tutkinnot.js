import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today} from "./format.js";
import {TUTKINTO_TYPES} from "./state.js";

export function emptyTutkintoDraft() {
  return {type: TUTKINTO_TYPES[0], date: today(), boatType: "Purjevene", maxPersons: 0, startTime: "", endTime: "", pricePerPerson: 0, location: "", notes: ""};
}

function draftFromTutkinto(t) {
  return {
    type: t.type || TUTKINTO_TYPES[0], date: t.date || today(), boatType: t.boatType || "Purjevene",
    maxPersons: Number(t.maxPersons || 0), startTime: t.startTime || "", endTime: t.endTime || "",
    pricePerPerson: Number(t.pricePerPerson || 0), location: t.location || "", notes: t.notes || ""
  };
}

registerAction("new-tutkinto", ({store}) => {
  store.setState({modal: "tutkinto", editId: null, tutkintoDraft: emptyTutkintoDraft()});
});

registerAction("edit-tutkinto", ({id, store}) => {
  const t = store.getState().tutkinnot.find(x => x.id === id);
  if (!t) return;
  store.setState({modal: "tutkinto", editId: id, tutkintoDraft: draftFromTutkinto(t)});
});

registerAction("save-tutkinto", async ({store}) => {
  const state = store.getState();
  const d = state.tutkintoDraft || {};
  const type = d.type || "";
  const date = d.date || "";
  if (!type || !date) { alert("Täytä tutkintotyyppi ja päivämäärä."); return; }
  const isPaikka = ["Rannikkopäällikkö", "Saaristopäällikkö"].includes(type);
  const data = {
    type, date,
    boatType: isPaikka ? (d.boatType || "Purjevene") : "",
    maxPersons: parseInt(d.maxPersons, 10) || 0,
    startTime: d.startTime || "", endTime: d.endTime || "",
    pricePerPerson: parseFloat(d.pricePerPerson) || 0,
    location: (d.location || "").trim(), notes: (d.notes || "").trim()
  };
  if (state.editId) await fsSet("tutkinnot", state.editId, data, store);
  else await fsAdd("tutkinnot", data, store);
  store.setState({modal: null, editId: null, tutkintoDraft: null});
});

registerAction("delete-tutkinto", async ({id, store}) => {
  const state = store.getState();
  const t = state.tutkinnot.find(x => x.id === id);
  const attendees = state.customers.filter(c => c.tutkintoId === id).length;
  const warn = attendees > 0 ? `\n\n⚠️ Tutkinnolla on ${attendees} osallistuja — heidän tietonsa jäävät rekisteriin.` : "";
  if (!confirm(`Poistetaanko tutkinto "${t?.type || ""}"?${warn}`)) return;
  await fsDel("tutkinnot", id, store);
});
