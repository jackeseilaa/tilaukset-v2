import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today} from "./format.js";

export function emptyBlockDraft() {
  return {date: today(), note: "", startTime: "", endTime: ""};
}

registerAction("edit-block-day", ({id, store}) => {
  const b = store.getState().blockedDays.find(x => x.id === id);
  if (!b) return;
  store.setState({blockEditId: id, blockDraft: {date: b.date || today(), note: b.note || "", startTime: b.startTime || "", endTime: b.endTime || ""}});
});

registerAction("cancel-block-day", ({store}) => {
  store.setState({blockEditId: null, blockDraft: emptyBlockDraft()});
});

registerAction("save-block-day", async ({store}) => {
  const state = store.getState();
  const d = state.blockDraft || {};
  const date = (d.date || "").trim();
  if (!date) { alert("Päivämäärä on pakollinen."); return; }
  const data = {date, note: (d.note || "").trim(), startTime: d.startTime || "", endTime: d.endTime || ""};
  if (state.blockEditId) await fsSet("blockedDays", state.blockEditId, data, store);
  else await fsAdd("blockedDays", data, store);
  store.setState({blockEditId: null, blockDraft: emptyBlockDraft()});
});

registerAction("delete-block-day", async ({id, store}) => {
  if (!confirm("Poistetaanko varaus?")) return;
  await fsDel("blockedDays", id, store);
});
