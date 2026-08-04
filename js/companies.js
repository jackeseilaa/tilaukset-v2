import {registerAction} from "./dispatch.js";
import {fsAdd, fsSet, fsDel} from "./db.js";

export function emptyCompanyDraft() {
  return {name: "", businessId: "", email: "", commissionPct: 0};
}

registerAction("new-company", ({store}) => {
  store.setState({modal: "company", editId: null, companyDraft: emptyCompanyDraft()});
});

registerAction("edit-company", ({id, store}) => {
  const co = store.getState().companies.find(x => x.id === id);
  if (!co) return;
  store.setState({
    modal: "company", editId: id,
    companyDraft: {name: co.name || "", businessId: co.businessId || "", email: co.email || "", commissionPct: co.commissionPct ?? 0}
  });
});

registerAction("save-company", async ({store}) => {
  const state = store.getState();
  const d = state.companyDraft || {};
  const name = (d.name || "").trim();
  if (!name) { alert("Yrityksen nimi on pakollinen."); return; }
  const data = {
    name,
    businessId: (d.businessId || "").trim(),
    email: (d.email || "").trim(),
    commissionPct: Number(d.commissionPct) || 0
  };
  if (state.editId) await fsSet("companies", state.editId, data, store);
  else await fsAdd("companies", data, store);
  store.setState({modal: null, editId: null, companyDraft: null});
});

registerAction("delete-company", async ({id, store}) => {
  if (!confirm("Poistetaanko yritys?")) return;
  await fsDel("companies", id, store);
});
