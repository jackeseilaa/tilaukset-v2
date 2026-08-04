import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today} from "./format.js";

export function emptyBlockDraft(date) {
  return {date: date || today(), note: "", startTime: "", endTime: ""};
}

// Kalenterin päivän 🔒-kuvake: jos päivä on jo varattu, poistaa merkinnän
// suoraan (ilman vahvistusta — sama käytös kuin vanhassa sovelluksessa,
// koska merkinnän voi aina lisätä uudelleen). Muuten avaa lisäysmodaalin.
registerAction("toggle-block", async ({date, store}) => {
  const existing = store.getState().blockedDays.find(b => b.date === date);
  if (existing) {
    await fsDel("blockedDays", existing.id, store);
  } else {
    store.setState({modal: "block-day", blockEditId: null, blockDraft: emptyBlockDraft(date)});
  }
});

registerAction("add-block-day-date", ({date, store}) => {
  store.setState({modal: "block-day", blockEditId: null, blockDraft: emptyBlockDraft(date)});
});

registerAction("add-block-day", ({store}) => {
  store.setState({modal: "block-day", blockEditId: null, blockDraft: emptyBlockDraft()});
});

registerAction("edit-block-day", ({id, store}) => {
  const b = store.getState().blockedDays.find(x => x.id === id);
  if (!b) return;
  store.setState({
    modal: "block-day", blockEditId: id,
    blockDraft: {date: b.date || today(), note: b.note || "", startTime: b.startTime || "", endTime: b.endTime || ""}
  });
});

registerAction("save-block-day", async ({store}) => {
  const state = store.getState();
  const d = state.blockDraft || {};
  const date = (d.date || "").trim();
  if (!date) { alert("Päivämäärä on pakollinen."); return; }
  const data = {date, note: (d.note || "").trim(), startTime: d.startTime || "", endTime: d.endTime || ""};
  if (state.blockEditId) await fsSet("blockedDays", state.blockEditId, data, store);
  else await fsAdd("blockedDays", data, store);
  store.setState({modal: null, blockEditId: null, blockDraft: null});
});

registerAction("delete-block-day", async ({id, store}) => {
  if (!confirm("Poistetaanko varaus?")) return;
  await fsDel("blockedDays", id, store);
  store.setState({modal: null, blockEditId: null, blockDraft: null});
});
