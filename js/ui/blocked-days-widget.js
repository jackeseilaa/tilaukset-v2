import {esc, fmtDate} from "../format.js";

// Väliaikainen hallintanäkymä Dashboardilla. Vanhassa sovelluksessa varatut
// ajat lisätään/muokataan suoraan kalenterista (päivän klikkaus tai 🔒-nappi) —
// kun Kalenteri-välilehti rakennetaan, tämä widget korvautuu sillä.
export function renderBlockedDaysWidget(state) {
  const editing = !!state.blockEditId;
  const d = state.blockDraft || {};
  const list = state.blockedDays.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  return `<div class="card">
    <div class="row-between"><div><div class="card-title">🔒 Varatut ajat</div><div class="card-sub">Väliaikainen hallintanäkymä — siirtyy Kalenteri-välilehteen kun se rakennetaan</div></div></div>
    <div class="hr"></div>
    <div class="grid2">
      <div class="field"><label class="lbl">Päivämäärä</label><input type="date" data-bind="blockDraft.date" value="${esc(d.date || "")}"></div>
      <div class="field"><label class="lbl">Otsikko / syy</label><input data-bind="blockDraft.note" value="${esc(d.note || "")}" placeholder="esim. Tallinna-matka, Kokous"></div>
    </div>
    <div class="grid2">
      <div class="field"><label class="lbl">Alkaa (klo)</label><input type="time" data-bind="blockDraft.startTime" value="${esc(d.startTime || "")}"></div>
      <div class="field"><label class="lbl">Loppuu (klo)</label><input type="time" data-bind="blockDraft.endTime" value="${esc(d.endTime || "")}"></div>
    </div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">
      ${editing ? `<button class="btn btn-secondary" data-action="cancel-block-day">Peruuta</button>` : ""}
      <button class="btn btn-primary" data-action="save-block-day">${editing ? "Tallenna muutokset" : "Lisää merkintä"}</button>
    </div>
    <div class="hr"></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei varattuja aikoja.</div>` : `
    <table class="table">
      <thead><tr><th>Päivä</th><th>Syy</th><th>Aika</th><th></th></tr></thead>
      <tbody>${list.map(b => `<tr style="${state.blockEditId === b.id ? "background:#fffde7" : ""}">
        <td style="font-weight:600;white-space:nowrap">${fmtDate(b.date)}</td>
        <td class="small muted">${esc(b.note || "")}</td>
        <td class="small muted">${b.startTime && b.endTime ? esc(b.startTime + "–" + b.endTime) : (b.startTime ? "klo " + esc(b.startTime) : "")}</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="edit-block-day" data-id="${b.id}">Muokkaa</button>
          <button class="btn btn-danger btn-sm" data-action="delete-block-day" data-id="${b.id}">Poista</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>`;
}
