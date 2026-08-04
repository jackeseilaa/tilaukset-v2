import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";

export function emptyMuuTuoteDraft() {
  return {nimi: "", ryhma: "", hinta: "", alv: "25.5", yksikko: "kpl", kuvaus: ""};
}

registerAction("new-muututuote", ({store}) => {
  store.setState({muuTuoteEditId: null, muuTuoteDraft: emptyMuuTuoteDraft()});
});

registerAction("edit-muututuote", ({id, store}) => {
  const p = store.getState().muutTuotteet.find(x => x.id === id);
  if (!p) return;
  store.setState({
    muuTuoteEditId: id,
    muuTuoteDraft: {nimi: p.nimi || "", ryhma: p.ryhma || "", hinta: p.hinta || "", alv: p.alv || "25.5", yksikko: p.yksikko || "kpl", kuvaus: p.kuvaus || ""}
  });
});

registerAction("cancel-muututuote", ({store}) => {
  store.setState({muuTuoteEditId: null, muuTuoteDraft: null});
});

registerAction("save-muututuote", async ({store}) => {
  const state = store.getState();
  const d = state.muuTuoteDraft || {};
  const nimi = (d.nimi || "").trim();
  if (!nimi) { alert("Nimi on pakollinen."); return; }
  const data = {
    nimi,
    ryhma: (d.ryhma || "").trim(),
    hinta: parseFloat(d.hinta) || 0,
    alv: d.alv || "25.5",
    yksikko: (d.yksikko || "kpl").trim(),
    kuvaus: (d.kuvaus || "").trim()
  };
  if (state.muuTuoteEditId) await fsSet("muutTuotteet", state.muuTuoteEditId, data, store);
  else await fsAdd("muutTuotteet", data, store);
  store.setState({muuTuoteEditId: null, muuTuoteDraft: null});
});

registerAction("delete-muututuote", async ({id, store}) => {
  if (!confirm("Poistetaanko tuote?")) return;
  await fsDel("muutTuotteet", id, store);
});
