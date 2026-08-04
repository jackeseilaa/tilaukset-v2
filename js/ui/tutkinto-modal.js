import {esc} from "../format.js";
import {TUTKINTO_TYPES} from "../state.js";

export function renderTutkintoModal(state) {
  const editing = !!state.editId;
  const d = state.tutkintoDraft || {};
  const isPaikka = ["Rannikkopäällikkö", "Saaristopäällikkö"].includes(d.type);
  return `<div class="overlay"><div class="modal" style="max-width:560px">
    <div class="modal-head"><div class="row-between"><div class="modal-title">${editing ? "Muokkaa tutkintoa" : "Uusi tutkintotilaisuus"}</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label class="lbl">Tutkintotyyppi *</label>
          <select data-bind="tutkintoDraft.type">
            ${TUTKINTO_TYPES.map(t => `<option value="${esc(t)}" ${t === d.type ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label class="lbl">Päivämäärä *</label><input type="date" data-bind="tutkintoDraft.date" value="${esc(d.date || "")}"></div>
      </div>
      <div class="grid2">
        ${isPaikka ? `<div class="field"><label class="lbl">Venetyyppi</label><select data-bind="tutkintoDraft.boatType"><option value="Purjevene" ${(d.boatType || "Purjevene") === "Purjevene" ? "selected" : ""}>⛵ Purjevene</option><option value="Moottorivene" ${d.boatType === "Moottorivene" ? "selected" : ""}>Moottorivene</option></select></div>` : `<div class="field"></div>`}
        <div class="field"><label class="lbl">Max osallistujia <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">(0 = ei rajoitusta)</span></label><input type="number" min="0" step="1" data-bind="tutkintoDraft.maxPersons" value="${esc(String(Number(d.maxPersons || 0)))}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Alkaa</label><input type="time" data-bind="tutkintoDraft.startTime" value="${esc(d.startTime || "")}"></div>
        <div class="field"><label class="lbl">Päättyy</label><input type="time" data-bind="tutkintoDraft.endTime" value="${esc(d.endTime || "")}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Hinta/hlö (€)</label><input type="number" min="0" step="0.01" data-bind="tutkintoDraft.pricePerPerson" value="${esc(String(Number(d.pricePerPerson || 0)))}"></div>
        <div class="field"><label class="lbl">Paikka</label><input data-bind="tutkintoDraft.location" value="${esc(d.location || "")}" placeholder="esim. Laivakoulu, Loviisa"></div>
      </div>
      <div class="field"><label class="lbl">Lisätiedot</label><textarea data-bind="tutkintoDraft.notes" rows="2" placeholder="Esim. ohjaaja, vaatimukset, huomiot…">${esc(d.notes || "")}</textarea></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-action="save-tutkinto">${editing ? "Tallenna muutokset" : "Tallenna"}</button></div>
    </div>
  </div></div>`;
}
