import {registerAction} from "./dispatch.js";
import {fsDel} from "./db.js";

export function findOrphanCustomers(state) {
  const sailingIds = new Set(state.sailings.map(s => s.id));
  const tutkintoIds = new Set(state.tutkinnot.map(t => t.id));
  return state.customers.filter(c =>
    (c.sailingId && !sailingIds.has(c.sailingId)) ||
    (c.tutkintoId && !tutkintoIds.has(c.tutkintoId))
  );
}

export function findDuplicatePersons(state) {
  const byName = new Map();
  for (const c of state.customers) {
    const nm = (c.name || "").trim().toLowerCase();
    if (!nm) continue;
    const key = (c.email || "").trim().toLowerCase() || (c.phone || "").replace(/\D/g, "") || "n:" + nm;
    if (!byName.has(nm)) byName.set(nm, new Set());
    byName.get(nm).add(key);
  }
  return Array.from(byName.entries()).filter(([, keys]) => keys.size > 1);
}

registerAction("delete-orphan-customers", async ({store}) => {
  const state = store.getState();
  const orphans = findOrphanCustomers(state);
  if (orphans.length === 0) return;
  if (!confirm(`Poistetaanko ${orphans.length} orpoa asiakastietuetta (viittaavat poistettuun purjehdukseen/tutkintoon)? Tätä ei voi perua.`)) return;
  for (const c of orphans) await fsDel("customers", c.id, store);
});
