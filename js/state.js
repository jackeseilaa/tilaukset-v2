import {today} from "./format.js";

// Alkutila. Domain-moduulit (sailings.js, invoices.js, ...) laajentavat
// tätä omilla draft-kentillään sitä mukaa kun ne rakennetaan — ks. suunnitelma
// (toteutusjärjestys) miksi vain runko + tyhjät välilehdet tulevat ensin.
export const initialState = {
  tab: "dashboard",
  user: null,
  syncing: false,
  modal: null,
  editId: null,
  meta: {},
  sailings: [], customers: [], companies: [], invoices: [],
  tutkinnot: [], muutTuotteet: [], kyselyt: [], blockedDays: [],

  // Yritykset (modaali, ei koskaan renderöi ilman modal==="company")
  companyDraft: null,

  // Muut tuotteet (lomake näkyy vain kun uusi/muokkaus aktiivinen)
  muuTuoteEditId: null,
  muuTuoteDraft: null,

  // Kyselyt (lomake näkyy aina, sama malli kuin vanhassa sovelluksessa)
  kyselyEditId: null,
  kyselyDraft: {nimi: "", puhelin: "", email: "", tyyppi: "purjehdus", aihe: "", lisatiedot: "", pvm: today()},
  kyselyQ: "",

  // Varatut ajat (väliaikainen Dashboard-widget kunnes Kalenteri rakennetaan)
  blockEditId: null,
  blockDraft: {date: today(), note: "", startTime: "", endTime: ""}
};

export const NAV_TABS = [
  ["dashboard", "🧭 Dashboard"],
  ["calendar", "📅 Kalenteri"],
  ["sailings", "⛵ Purjehdukset"],
  ["muuttuotteet", "📦 Muut tuotteet"],
  ["customers", "👤 Asiakkaat"],
  ["companies", "🏢 Yritykset"],
  ["invoicing", "🧾 Laskutus"],
  ["reskontra", "📊 Reskontra"],
  ["tasmaytys", "🔍 Täsmäytys"],
  ["kyselyt", "📋 Kyselyt"]
];
