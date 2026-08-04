import {registerAction} from "./dispatch.js";
import {fsSet} from "./db.js";
import {today} from "./format.js";
import {downloadCsv, csvNumber} from "./csv.js";
import {custEventLabel, custEventDate} from "./customers.js";

const COLLECTIONS = ["sailings", "customers", "companies", "invoices", "tutkinnot", "muutTuotteet", "kyselyt", "blockedDays"];

export function buildBackupPayload(state) {
  const payload = {version: 1, app: "tilaukset-v2", exportedAt: new Date().toISOString()};
  for (const col of COLLECTIONS) payload[col] = state[col];
  return payload;
}

registerAction("export-json", ({store}) => {
  const payload = buildBackupPayload(store.getState());
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `tilaukset_varmuuskopio_${today()}.json`; a.click();
  URL.revokeObjectURL(url);
});

registerAction("restore-json", async ({file, store}) => {
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch (e) {
    alert("Palautus epäonnistui: tiedosto ei ole kelvollinen JSON.");
    return;
  }
  const counts = COLLECTIONS.filter(c => Array.isArray(data[c])).map(c => `${c}: ${data[c].length}`);
  if (!confirm(`Palautetaanko varmuuskopio?\n\n${counts.join("\n")}\n\nTämä kirjoittaa dokumentit takaisin Firestoreen (ei poista olemassa olevia, joita ei ole varmuuskopiossa).`)) return;
  for (const col of COLLECTIONS) {
    const rows = Array.isArray(data[col]) ? data[col] : [];
    for (const row of rows) {
      const {id, ...fields} = row;
      if (!id) continue;
      await fsSet(col, id, fields, store);
    }
  }
  alert("Palautus valmis.");
});

registerAction("export-customers-csv", ({store}) => {
  const state = store.getState();
  const rows = state.customers.map(c => [
    c.name || "", c.phone || "", c.email || "",
    custEventLabel(state, c), custEventDate(state, c),
    c.reservationStatus || "", c.billTo === "company" ? (state.companies.find(co => co.id === c.companyId)?.name || "") : "",
    c.priceOverride != null && c.priceOverride !== "" ? csvNumber(c.priceOverride) : ""
  ]);
  downloadCsv(`asiakkaat_${today()}.csv`, ["Nimi", "Puhelin", "Sähköposti", "Tapahtuma", "Päivä", "Status", "Yritys", "Hinta"], rows);
});

registerAction("export-sailings-csv", ({store}) => {
  const state = store.getState();
  const rows = state.sailings.map(s => [
    s.name || "", s.type || "", s.date || "", s.endDate || "",
    csvNumber(s.maxPersons), csvNumber(s.reserveSlots), csvNumber(s.pricePerPerson), csvNumber(s.reservationFee),
    s.reitti || ""
  ]);
  downloadCsv(`purjehdukset_${today()}.csv`, ["Nimi", "Tyyppi", "Alkaa", "Päättyy", "Max", "Vara", "Hinta", "Varausmaksu", "Reitti"], rows);
});
