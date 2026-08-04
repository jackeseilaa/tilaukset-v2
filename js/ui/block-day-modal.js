import {esc} from "../format.js";

export function renderBlockDayModal(state) {
  const editing = !!state.blockEditId;
  const d = state.blockDraft || {};
  return `<div class="overlay"><div class="modal" style="max-width:420px">
    <div class="modal-head"><div class="row-between"><div class="modal-title">🔒 ${editing ? "Muokkaa varausta" : "Merkitse varatuksi"}</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
      <div class="field"><label class="lbl">Päivämäärä</label><input type="date" data-bind="blockDraft.date" value="${esc(d.date || "")}"></div>
      <div class="field"><label class="lbl">Otsikko / syy</label><input data-bind="blockDraft.note" value="${esc(d.note || "")}" placeholder="esim. Tallinna-matka, Kokous, Varattu…"></div>
      <div class="grid2">
        <div class="field"><label class="lbl">Alkaa (klo)</label><input type="time" data-bind="blockDraft.startTime" value="${esc(d.startTime || "")}"></div>
        <div class="field"><label class="lbl">Loppuu (klo)</label><input type="time" data-bind="blockDraft.endTime" value="${esc(d.endTime || "")}"></div>
      </div>
      <div class="row" style="justify-content:flex-end;gap:8px">
        ${editing ? `<button class="btn btn-danger" data-action="delete-block-day" data-id="${state.blockEditId}">Poista</button>` : ""}
        <button class="btn btn-secondary" data-action="close-modal">Peruuta</button>
        <button class="btn btn-primary" data-action="save-block-day">${editing ? "Tallenna muutokset" : "Lisää merkintä"}</button>
      </div>
    </div>
  </div></div>`;
}
