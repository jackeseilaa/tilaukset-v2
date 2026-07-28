// Keskitetty ALV-laskenta. Vanhassa sovelluksessa 25,5 %:n ja 13,5 %:n
// ALV-kannat sekä niistä laskettu netto/ALV/brutto oli kirjoitettu erikseen
// 5-6 eri kohtaan koodia — yksi niistä (muutTuotteet-tuoterivien polku)
// käytti kiinteää 25,5 % vaikka tuotteella oli oma 13,5 %:n ALV-kenttä,
// eli väärä ALV saatettiin laskuttaa siitä polusta. Kaikki laskut käyttävät
// jatkossa vain näitä funktioita.
export const VAT_RATES = {
  YLEINEN: 25.5,
  ALENNETTU: 13.5,
  KANSAINVALINEN: 0
};

// rate prosentteina (esim. 25.5), gross bruttosumma senteissä tarkkuutta
// varten laskettuna euroina (desimaalilukuna) — palauttaa {net, vat, gross}.
export function vatFromGross(gross, ratePct) {
  const g = Number(gross) || 0;
  const r = Number(ratePct) || 0;
  const net = r > 0 ? g / (1 + r / 100) : g;
  return {net, vat: g - net, gross: g};
}

export function vatFromNet(net, ratePct) {
  const n = Number(net) || 0;
  const r = Number(ratePct) || 0;
  const vat = n * (r / 100);
  return {net: n, vat, gross: n + vat};
}

// Ratkaisee oikean ALV-kannan: kansainvälinen purjehdus/tuote voittaa aina,
// muuten tuotteen/purjehduksen oma alv-kenttä, oletuksena yleinen kanta.
export function resolveVatRate({kansainvalinen, alv} = {}) {
  if (kansainvalinen) return VAT_RATES.KANSAINVALINEN;
  if (Number(alv) === VAT_RATES.ALENNETTU) return VAT_RATES.ALENNETTU;
  return VAT_RATES.YLEINEN;
}
