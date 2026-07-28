// Alkutila. Domain-moduulit (sailings.js, invoices.js, ...) laajentavat
// tätä omilla draft-kentillään sitä mukaa kun ne rakennetaan — ks. suunnitelma
// (toteutusjärjestys) miksi vain runko + tyhjät välilehdet tulevat ensin.
export const initialState = {
  tab: "dashboard",
  user: null,
  syncing: false,
  modal: null,
  meta: {},
  sailings: [], customers: [], companies: [], invoices: [],
  tutkinnot: [], muutTuotteet: [], kyselyt: [], blockedDays: []
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
