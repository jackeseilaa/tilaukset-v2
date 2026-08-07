// Sähköpostilähetyksen asetukset — Google Apps Script -reitti.
// Täytä EMAIL_WEBAPP_URL kun Apps Script -projekti on julkaistu Web Appina,
// ks. email-relay/README.md juurihakemistossa täydelliset ohjeet.
export const EMAIL_WEBAPP_URL = "KORVAA_APPS_SCRIPT_WEB_APP_URL";

// Jaettu salasana joka estää muita kuin tätä sovellusta kutsumasta Web Appia.
// Sama arvo pitää olla myös Apps Script -koodin SHARED_SECRET-muuttujassa.
export const EMAIL_SECRET = "de2b0872dca046489a03e44e0ec441f27c2b37cd29f344ceb50c8cfd4e2beeda";

export const EMAIL_CONFIG_READY = !EMAIL_WEBAPP_URL.includes("KORVAA");
