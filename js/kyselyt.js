import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";
import {today} from "./format.js";

export function emptyKyselyDraft() {
  return {nimi: "", puhelin: "", email: "", tyyppi: "purjehdus", aihe: "", lisatiedot: "", pvm: today()};
}

registerAction("edit-kysely", ({id, store}) => {
  const k = store.getState().kyselyt.find(x => x.id === id);
  if (!k) return;
  store.setState({
    kyselyEditId: id,
    kyselyDraft: {nimi: k.nimi || "", puhelin: k.puhelin || "", email: k.email || "", tyyppi: k.tyyppi || "purjehdus", aihe: k.aihe || "", lisatiedot: k.lisatiedot || "", pvm: k.pvm || today()}
  });
});

registerAction("cancel-kysely", ({store}) => {
  store.setState({kyselyEditId: null, kyselyDraft: emptyKyselyDraft()});
});

registerAction("save-kysely", async ({store}) => {
  const state = store.getState();
  const d = state.kyselyDraft || {};
  const nimi = (d.nimi || "").trim();
  if (!nimi) { alert("Nimi on pakollinen."); return; }
  const data = {
    nimi,
    puhelin: d.puhelin || "",
    email: d.email || "",
    tyyppi: d.tyyppi || "purjehdus",
    aihe: d.aihe || "",
    lisatiedot: d.lisatiedot || "",
    pvm: d.pvm || today()
  };
  if (state.kyselyEditId) await fsSet("kyselyt", state.kyselyEditId, data, store);
  else await fsAdd("kyselyt", data, store);
  store.setState({kyselyEditId: null, kyselyDraft: emptyKyselyDraft()});
});

registerAction("delete-kysely", async ({id, store}) => {
  if (!confirm("Poistetaanko kysely?")) return;
  await fsDel("kyselyt", id, store);
});
