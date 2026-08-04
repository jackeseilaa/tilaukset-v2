import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today, addDays} from "./format.js";
import {SAILING_TYPES} from "./state.js";

export function enrolledCount(state, sailingId) {
  return state.customers.filter(c => c.sailingId === sailingId).length;
}
export function confirmedCount(state, sailingId) {
  return state.customers.filter(c => c.sailingId === sailingId && c.reservationStatus === "paid").length;
}
export function pendingCount(state, sailingId) {
  return state.customers.filter(c => c.sailingId === sailingId && c.reservationStatus === "pending").length;
}
export function reserveCount(state, sailingId) {
  return state.customers.filter(c => c.sailingId === sailingId && c.reservationStatus === "reserve").length;
}

export function emptySailingDraft(date) {
  return {
    name: "", reitti: "", kansainvalinen: false,
    type: SAILING_TYPES[0], date: date || today(), endDate: "",
    startTime: "", endTime: "",
    maxPersons: 6, reserveSlots: 2, pricePerPerson: 0, reservationFee: 0
  };
}

function draftFromSailing(s) {
  return {
    name: s.name || "", reitti: s.reitti || "", kansainvalinen: !!s.kansainvalinen,
    type: s.type || SAILING_TYPES[0], date: s.date || today(), endDate: s.endDate || "",
    startTime: s.startTime || "", endTime: s.endTime || "",
    maxPersons: Number(s.maxPersons ?? 6), reserveSlots: Number(s.reserveSlots ?? 2),
    pricePerPerson: Number(s.pricePerPerson ?? 0), reservationFee: Number(s.reservationFee ?? 0)
  };
}

// Tarkistaa osuuko uusi purjehdus päivämäärältään/kellonajaltaan päällekkäin
// olemassa olevan kanssa. Yksinkertaistettu versio vanhan sovelluksen
// checkConflicts-funktiosta — kurssien sessiot/teoriapäivät ja tutkinnot
// eivät vielä ole tässä sovelluksessa, joten niitä ei tarkisteta.
export function checkConflicts(state, date, endDate, startTime, endTime, skipId) {
  const d1 = date, d2 = endDate || date;
  const conflicts = [];
  const newDays = [];
  let cur = new Date(d1 + "T12:00:00");
  const end = new Date(d2 + "T12:00:00");
  while (cur <= end) { newDays.push(cur.toISOString().slice(0, 10)); cur.setDate(cur.getDate() + 1); }

  const toMin = t => { if (!t) return null; const [h, m] = (t || "00:00").split(":").map(Number); return h * 60 + (m || 0); };
  const s1 = toMin(startTime), e1 = toMin(endTime) || (s1 !== null ? s1 + 60 : null);
  const overlapsTime = (s2str, e2str) => {
    if (s1 === null || !s2str) return true;
    const s2 = toMin(s2str), e2 = toMin(e2str) || (s2 + 60);
    return s1 < e2 && s2 < (e1 || s1 + 60);
  };

  for (const s of state.sailings) {
    if (s.id === skipId) continue;
    const sd1 = s.date, sd2 = s.endDate || s.date;
    const sDays = [];
    let c2 = new Date(sd1 + "T12:00:00");
    const e2 = new Date(sd2 + "T12:00:00");
    while (c2 <= e2) { sDays.push(c2.toISOString().slice(0, 10)); c2.setDate(c2.getDate() + 1); }
    if (newDays.some(d => sDays.includes(d)) && overlapsTime(s.startTime, s.endTime)) {
      conflicts.push(`⛵ ${s.name} (${sd1}${sd2 !== sd1 ? "–" + sd2 : ""}${s.startTime ? " klo " + s.startTime : ""})`);
    }
  }
  return conflicts;
}

registerAction("new-sailing", ({store}) => {
  store.setState({modal: "sailing", editId: null, sailingDraft: emptySailingDraft()});
});

registerAction("add-sailing-date", ({date, store}) => {
  store.setState({modal: "sailing", editId: null, sailingDraft: emptySailingDraft(date)});
});

registerAction("edit-sailing", ({id, store}) => {
  const s = store.getState().sailings.find(x => x.id === id);
  if (!s) return;
  store.setState({modal: "sailing", editId: id, sailingDraft: draftFromSailing(s)});
});

registerAction("copy-sailing", ({id, store}) => {
  const s = store.getState().sailings.find(x => x.id === id);
  if (!s) return;
  store.setState({
    modal: "sailing", editId: null,
    sailingDraft: {...draftFromSailing(s), name: s.name + " (kopio)", date: today(), endDate: ""}
  });
});

registerAction("toggle-sailing-intl", ({store}) => {
  const state = store.getState();
  const d = state.sailingDraft || emptySailingDraft();
  d.kansainvalinen = !d.kansainvalinen;
  store.setState({sailingDraft: d});
});

registerAction("save-sailing", async ({store}) => {
  const state = store.getState();
  const d = state.sailingDraft || {};
  const name = (d.name || "").trim();
  const date = d.date || "";
  const type = d.type || "";
  if (!name || !date || !type) { alert("Täytä pakolliset kentät."); return; }
  const endDate = d.endDate || "";
  if (endDate && endDate < date) { alert("Paluupäivä ei voi olla ennen alkamispäivää."); return; }
  const conflicts = checkConflicts(state, date, endDate || date, d.startTime || "", d.endTime || "", state.editId || null);
  if (conflicts.length > 0) {
    const msg = `Päällekkäisyys löytyi:\n\n${conflicts.join("\n")}\n\nHaluatko tallentaa silti?`;
    if (!confirm(msg)) return;
  }
  const data = {
    name, date, type,
    reitti: (d.reitti || "").trim(),
    kansainvalinen: !!d.kansainvalinen,
    endDate,
    startTime: d.startTime || "",
    endTime: d.endTime || "",
    maxPersons: parseInt(d.maxPersons, 10) || 1,
    reserveSlots: Math.max(0, parseInt(d.reserveSlots, 10) || 0),
    pricePerPerson: parseFloat(d.pricePerPerson) || 0,
    reservationFee: parseFloat(d.reservationFee) || 0
  };
  if (state.editId) await fsSet("sailings", state.editId, data, store);
  else await fsAdd("sailings", data, store);
  store.setState({modal: null, editId: null, sailingDraft: null});
});

registerAction("delete-sailing", async ({id, store}) => {
  const state = store.getState();
  const s = state.sailings.find(x => x.id === id);
  const attendees = enrolledCount(state, id);
  const warn = attendees > 0 ? `\n\n⚠️ Kurssilla on ${attendees} osallistuja — heidän tietonsa jäävät rekisteriin.` : "";
  if (!confirm(`Poistetaanko purjehdus "${s?.name || ""}"?${warn}`)) return;
  await fsDel("sailings", id, store);
  store.setState({modal: null, editId: null});
});

registerAction("set-group", ({id, store}) => { store.setState({sailingGroup: id}); });
