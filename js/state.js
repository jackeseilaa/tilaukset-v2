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
  expandedPerson: null
};

export const SAILING_TYPES = ["Iltapurjehdus", "Päiväpurjehdus", "Charter", "Kurssi", "Yritystilaisuus", "Purjehdusretki", "Muu"];

export const SAILING_GROUPS = [
  {id: "all", label: "Kaikki", types: null},
  {id: "courses", label: "Kurssit", types: ["Kurssi"]},
  {id: "charter", label: "Charter", types: ["Charter"]},
  {id: "evening", label: "Iltapurjehdukset", types: ["Iltapurjehdus"]},
  {id: "trips", label: "Retket", types: ["Purjehdusretki"]},
  {id: "day", label: "Päiväpurjehdukset", types: ["Päiväpurjehdus"]},
  {id: "other", label: "Muut", types: ["Yritystilaisuus", "Muu"]}
];

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
