import {deleteField} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {registerAction} from "./dispatch.js";
import {fsSet} from "./db.js";
import {esc, fmtDate, today} from "./format.js";

// Google Kalenteri -vienti (siirretty V9:n gcalUrl + gcalButtonTutkinto -toteutuksesta).
// Ei API-integraatiota: nappi avaa Google Kalenterin valmiiksi täytetyllä
// tapahtumapohjalla, ja "Kalenterissa"-merkintä tallennetaan tutkinnon
// dokumenttiin kenttiin gcal_<id> ja gcal_<id>_date.
export function gcalUrl(title, date, startTime, endTime, description, endDate, location) {
  const fmt = (d, t) => {
    if (!t) return d.replace(/-/g, "");
    const [h, m] = t.split(":").map(s => s.padStart(2, "0"));
    return d.replace(/-/g, "") + "T" + h + (m || "00") + "00";
  };
  let start, end;
  if (startTime) {
    start = fmt(date, startTime);
    end = endTime ? fmt(endDate || date, endTime) : fmt(date, String(parseInt(startTime) + 2).padStart(2, "0") + ":00");
  } else {
    start = date.replace(/-/g, "");
    // Koko päivän tapahtuman loppupäivä on Google Kalenterissa eksklusiivinen.
    const d = new Date((endDate || date) + "T12:00:00");
    d.setDate(d.getDate() + 1);
    end = d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  const params = new URLSearchParams({
    action: "TEMPLATE", text: title, dates: start + "/" + end,
    details: description || "J Sailing", location: location || "", ctz: "Europe/Helsinki"
  });
  return "https://calendar.google.com/calendar/render?" + params.toString();
}

const GCAL_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" style="flex-shrink:0"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#4285F4" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#4285F4" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="#4285F4" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="#4285F4" stroke-width="2"/></svg>`;

function tutkintoTitle(t) {
  return (t.type || "Tutkinto") + (t.boatType ? " (" + t.boatType + ")" : "");
}

export function gcalButtonTutkinto(t) {
  if (!t || !t.id || !t.date) return "";
  const gcKey = `gcal_${t.id}`;
  const added = t[gcKey] === true, addedDate = t[gcKey + "_date"] || "";
  const title = tutkintoTitle(t);
  const desc = `${title} · J Sailing · Pätevyystutkinto${t.notes ? "\n\n" + t.notes : ""}`;
  const url = gcalUrl(title, t.date, t.startTime || null, t.endTime || null, desc, null, t.location || "");
  if (added) return `<span class="badge badge-gcal" style="font-size:11px">✅ Kalenterissa ${addedDate ? fmtDate(addedDate) : ""}</span><a href="${esc(url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" data-action="gcal-mark-tutkinto" data-id="${esc(t.id)}" style="font-size:11px">🔄 Päivitä</a><button class="btn btn-danger btn-sm" data-action="gcal-unmark-tutkinto" data-id="${esc(t.id)}" style="font-size:11px" title="Poista kalenterimerkintä">🗑️</button>`;
  return `<a href="${esc(url)}" target="_blank" rel="noopener" class="btn btn-gcal btn-sm" data-action="gcal-mark-tutkinto" data-id="${esc(t.id)}">${GCAL_ICON}Lisää kalenteriin</a>`;
}

// Linkin oletustoiminto (uusi välilehti) säilyy, koska dispatch ei kutsu
// preventDefaultia — käsittelijä vain merkitsee tutkinnon kalenteriin lisätyksi.
registerAction("gcal-mark-tutkinto", async ({id, store}) => {
  if (!id) return;
  await fsSet("tutkinnot", id, {[`gcal_${id}`]: true, [`gcal_${id}_date`]: today()}, store);
});

registerAction("gcal-unmark-tutkinto", async ({id, store}) => {
  const t = store.getState().tutkinnot.find(x => x.id === id);
  if (!t) return;
  const ok = confirm(`Poistetaan "${tutkintoTitle(t)}" kalenterimerkintä.\n\nGoogle Kalenteri avataan hakuun, jotta voit poistaa tapahtuman myös sieltä.`);
  if (!ok) return;
  await fsSet("tutkinnot", id, {[`gcal_${id}`]: deleteField(), [`gcal_${id}_date`]: deleteField()}, store);
  window.open("https://calendar.google.com/calendar/r/search?q=" + encodeURIComponent(t.type || "tutkinto"), "_blank");
});

if (typeof document !== "undefined" && !document.getElementById("gcal-css")) {
  const style = document.createElement("style");
  style.id = "gcal-css";
  style.textContent = `.btn-gcal{background:#ffffff;color:#1a1a2e;border:1.5px solid #d1d5db;box-shadow:0 1px 4px rgba(0,0,0,.1);}
.btn-gcal:hover{background:#f8f9fa;border-color:#4285F4;color:#1a73e8;}
.badge-gcal{background:#e8f0fe;color:#1a73e8;border:1px solid #aecbfa;}`;
  document.head.appendChild(style);
}
