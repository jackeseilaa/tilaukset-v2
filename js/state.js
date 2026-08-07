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
  invoiceCounter: {},
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

  // Varatut ajat (modal==="block-day", hallitaan Kalenterista)
  blockEditId: null,
  blockDraft: null,

  // Purjehdukset (modal==="sailing")
  sailingDraft: null,
  searchSailings: "",
  sailingGroup: "all",

  // Kalenteri
  calendarMonth: today().slice(0, 7),
  calView: "month",
  calDayDate: today(),

  // Asiakkaat (modal==="customer")
  customerDraft: null,
  searchCustomers: "",
  expandedPerson: null,

  // Laskutus
  editInvoiceId: null,
  invoiceDraft: {issuer: "tmi", source: "sailing", sailingId: "", tutkintoId: "", mode: "customer", type: "full", invoiceDate: today(), customerId: "", companyId: "", partialAmount: "", creditRefId: "", note: "", tuoteLines: {}},
  registerMonth: today().slice(0, 7),
  registerIssuerFilter: "all",

  // Tutkinnot (modal==="tutkinto")
  tutkintoDraft: null,
  searchTutkinnot: "",

  // Admin (lue-vain diagnostiikka)
  adminOrphanIds: []
};

export const ISSUERS = {
  tmi: {name: "J Sailing", businessId: "1728993-9", address: "Kontiontie 55, 11120 Riihimäki", iban: "FI62 1132 3000 4277 43", bic: "NDEAFIHH"},
  oy: {name: "AJarmo Oy", businessId: "3432355-3", address: "Kontiontie 55, 11120 Riihimäki", iban: "FI73 7997 7994 4257 05", bic: "HOLVFIHH"}
};

export const SAILING_TYPES = ["Iltapurjehdus", "Päiväpurjehdus", "Charter", "Kurssi", "Yritystilaisuus", "Purjehdusretki", "Muu"];

// Ei oikea purjehdustyyppi — valinta Tyyppi-valikossa joka ohjaa uuden
// purjehduksen lomakkeen sijaan Tutkinto-modaaliin (ks. sailings.js:
// "sailing-type-picked"). Tätä arvoa ei koskaan tallenneta Firestoreen.
export const SAILING_TUTKINTO_OPTION = "__tutkinto__";

export const SAILING_GROUPS = [
  {id: "all", label: "Kaikki", types: null},
  {id: "courses", label: "Kurssit", types: ["Kurssi"]},
  {id: "charter", label: "Charter", types: ["Charter"]},
  {id: "evening", label: "Iltapurjehdukset", types: ["Iltapurjehdus"]},
  {id: "trips", label: "Retket", types: ["Purjehdusretki"]},
  {id: "day", label: "Päiväpurjehdukset", types: ["Päiväpurjehdus"]},
  {id: "other", label: "Muut", types: ["Yritystilaisuus", "Muu"]}
];

export const TUTKINTO_TYPES = ["Rannikkopäällikkö", "Saaristopäällikkö", "ICC näyttökoe", "Vuokraveneenkuljettaja näyttökoe", "Muu"];

export const NAV_TABS = [
  ["dashboard", "🧭 Dashboard"],
  ["calendar", "📅 Kalenteri"],
  ["sailings", "⛵ Purjehdukset"],
  ["muuttuotteet", "📦 Muut tuotteet"],
  ["customers", "👤 Asiakkaat"],
  ["companies", "🏢 Yritykset"],
  ["tutkinnot", "🎓 Tutkinnot"],
  ["invoicing", "🧾 Laskutus"],
  ["reskontra", "📊 Reskontra"],
  ["tasmaytys", "🔍 Täsmäytys"],
  ["kyselyt", "📋 Kyselyt"],
  ["admin", "🛠️ Admin"]
];
