import {registerAction} from "./dispatch.js";
import {fsSet} from "./db.js";
import {today} from "./format.js";
import {ALLOWED_EMAIL} from "./firebase.js";
import {buildBackupPayload} from "./backup.js";
import {DRIVE_OAUTH_CLIENT_ID, DRIVE_BACKUP_FOLDER_ID, DRIVE_CONFIG_READY} from "./drive-config.js";

let driveTokenClient = null;

// Google Identity Services -pohjainen valtuutus, sama malli kuin vanhassa
// sovelluksessa ja quartet-lokissa. Kysyy käyttäjältä Drive-luvan joka
// istunnossa (token ei säily selaimen sulkemisen yli) — tarkoituksella,
// tämä on yhden omistajan sisäinen työkalu, ei tarvitse pysyvää valtuutusta.
function getDriveAccessToken() {
  return new Promise((resolve, reject) => {
    if (typeof google === "undefined" || !google.accounts || !google.accounts.oauth2) {
      reject(new Error("Google Identity Services -kirjasto ei latautunut (tarkista nettiyhteys ja yritä uudelleen).")); return;
    }
    if (!driveTokenClient) {
      driveTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: DRIVE_OAUTH_CLIENT_ID,
        scope: "https://www.googleapis.com/auth/drive",
        callback: () => {},
        error_callback: () => {}
      });
    }
    driveTokenClient.callback = (resp) => {
      if (resp.error) reject(new Error("Drive-valtuutus evätty: " + resp.error));
      else resolve(resp.access_token);
    };
    driveTokenClient.error_callback = (err) => reject(new Error("Drive-valtuutus epäonnistui: " + (err && (err.message || err.type) || "tuntematon virhe")));
    driveTokenClient.requestAccessToken({hint: ALLOWED_EMAIL});
  });
}

async function uploadBackupToDrive(state) {
  const payload = buildBackupPayload(state);
  const filename = `tilaukset-v2_varmuuskopio_${today()}.json`;
  const accessToken = await getDriveAccessToken();
  const metadata = {name: filename, parents: [DRIVE_BACKUP_FOLDER_ID], mimeType: "application/json"};
  const boundary = "tilaukset_v2_backup_boundary";
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(payload, null, 2)}\r\n--${boundary}--`;
  const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
    method: "POST",
    headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}`},
    body
  });
  if (!res.ok) { const errText = await res.text(); throw new Error(`Drive-lataus epäonnistui (${res.status}): ${errText}`); }
  return res.json();
}

registerAction("export-drive", async ({el, store}) => {
  if (!DRIVE_CONFIG_READY) { alert("Drive-varmuuskopiointia ei ole vielä otettu käyttöön (js/drive-config.js täyttämättä)."); return; }
  const state = store.getState();
  const original = el.textContent;
  el.textContent = "☁️ Viedään…"; el.disabled = true;
  try {
    await uploadBackupToDrive(state);
    await fsSet("meta", "app", {driveBackupAt: new Date().toISOString()}, store);
    alert('Varmuuskopio tallennettu Google Driveen (kansio "Tilaukset v2 varmuuskopiot").');
  } catch (err) {
    alert("Drive-vienti epäonnistui: " + err.message);
  }
  el.textContent = original; el.disabled = false;
});
