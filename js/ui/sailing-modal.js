import {esc, fmtDate, today} from "../format.js";
import {SAILING_TYPES} from "../state.js";

export function renderSailingModal(state) {
  const editing = !!state.editId;
  const d = state.sailingDraft || {};
  const isMultiDay = !!d.endDate;
  let durationInfo = "";
  if (d.date && d.endDate && d.endDate > d.date) {
    const days = Math.round((new Date(d.endDate + "T12:00:00") - new Date(d.date + "T12:00:00")) / 86400000) + 1;
    durationInfo = `<div class="infobox infobox-blue" style="margin-top:4px">📅 Kesto: ${days} vrk (${fmtDate(d.date)} – ${fmtDate(d.endDate)})</div>`;
  }
  return `<div class="overlay"><div class="modal">
    <div class="modal-head"><div class="row-between">
      <div class="modal-title">${editing ? "Muokkaa purjehdusta" : "Uusi purjehdus"}</div>
      <div class="row">
        ${editing ? `<button class="btn btn-secondary btn-sm" data-action="copy-sailing" data-id="${state.editId}" title="Kopioi kaikki tiedot uudelle päivälle">📋 Kopioi uudelle päivälle</button>` : ""}
        <button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button>
      </div>
    </div></div>
    <div class="modal-body">
      <div class="field"><label class="lbl">Nimi *</label><input data-bind="sailingDraft.name" value="${esc(d.name || "")}"></div>
      <div class="field"><label class="lbl">Reitti <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">(esim. Hanko–Tallinna–Helsinki)</span></label><input data-bind="sailingDraft.reitti" value="${esc(d.reitti || "")}" placeholder="Valinnainen — näkyy kalenterissa"></div>
      <div class="field" style="display:flex;align-items:center;gap:10px;margin-top:8px">
        <button type="button" class="btn" data-action="toggle-sailing-intl" style="flex:0 0 auto;padding:6px 12px;border:2px solid #d1d5db;border-radius:6px;background:${d.kansainvalinen ? "#0a4272" : "#fff"};color:${d.kansainvalinen ? "#fff" : "#1a1a2e"};font-weight:600;font-size:13px;cursor:pointer">🌍 ${d.kansainvalinen ? "Kansainvälinen (ALV 0%)" : "Ei kansainvälinen"}</button>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Tyyppi *</label>
          <select data-bind="sailingDraft.type">
            ${SAILING_TYPES.map(t => `<option value="${esc(t)}" ${t === (d.type || SAILING_TYPES[0]) ? "selected" : ""}>${esc(t)}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label class="lbl">Alkamispäivä *</label><input type="date" data-bind="sailingDraft.date" value="${esc(d.date || today())}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Paluupäivä <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">(jos useampi päivä)</span></label><input type="date" data-bind="sailingDraft.endDate" value="${esc(d.endDate || "")}"></div>
        <div class="field">${durationInfo}</div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">${isMultiDay ? "Lähtöaika" : "Aloitusaika"}</label><input type="time" data-bind="sailingDraft.startTime" value="${esc(d.startTime || "")}"></div>
        <div class="field"><label class="lbl">${isMultiDay ? "Paluuaika" : "Lopetusaika"}</label><input type="time" data-bind="sailingDraft.endTime" value="${esc(d.endTime || "")}"></div>
      </div>
      <div class="hr"></div>
      <div class="grid2">
        <div class="field"><label class="lbl">Max hlö *</label><input type="number" min="1" step="1" data-bind="sailingDraft.maxPersons" value="${esc(String(Number(d.maxPersons ?? 6)))}"></div>
        <div class="field"><label class="lbl">Varapaikkoja</label><input type="number" min="0" step="1" data-bind="sailingDraft.reserveSlots" value="${esc(String(Number(d.reserveSlots ?? 2)))}"><div class="small muted" style="margin-top:4px">Suositus: vähintään 2</div></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Hinta/hlö (€)</label><input type="number" min="0" step="0.01" data-bind="sailingDraft.pricePerPerson" value="${esc(String(Number(d.pricePerPerson ?? 0)))}"></div>
        <div class="field"><label class="lbl">Varausmaksu (€)</label><input type="number" min="0" step="0.01" data-bind="sailingDraft.reservationFee" value="${esc(String(Number(d.reservationFee ?? 0)))}"><div class="small muted" style="margin-top:4px">0 = ei varausmaksua</div></div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        <button class="btn btn-primary" data-action="save-sailing">${editing ? "Tallenna muutokset" : "Tallenna"}</button>
      </div>
    </div>
  </div></div>`;
}
