// Drive-varmuuskopioinnin asetukset. OAuth-client-ID ei ole salaisuus (se on
// tarkoitettu näkymään selaimen JS:ssä — Google Cloud Consolen "Authorized
// JavaScript origins" -rajaus tekee todellisen suojauksen), mutta sen pitää
// olla oma tälle projektille (jsailing-tilaukset-v2), koska OAuth-clientit on
// sidottu tiettyyn Google Cloud -projektiin eikä vanhan sovelluksen clientiä
// voi käyttää uudelleen.
export const DRIVE_OAUTH_CLIENT_ID = "KORVAA_GOOGLE_OAUTH_CLIENT_ID";

// Luotu valmiiksi: "Tilaukset v2 varmuuskopiot" -kansio Drivessa.
export const DRIVE_BACKUP_FOLDER_ID = "1WqMoBd27hoXnY5ERFT82uesXG7QRke68";

export const DRIVE_CONFIG_READY = !DRIVE_OAUTH_CLIENT_ID.includes("KORVAA");
