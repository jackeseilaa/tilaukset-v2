import {esc} from "../format.js";

// Henkilön yhteystietojen kertamuokkaus — avataan Asiakkaat-välilehdeltä
// (ei per-purjehdus, vaan koko henkilölle kerralla). Ks. customers.js:
// edit-person/save-person.
export function renderPersonModal(state) {
  const d = state.personDraft || {};
  return `<div class="overlay"><div class="modal">
    <div class="modal-head"><div class="row-between"><div class="modal-title">Muokkaa henkilön tietoja</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body">
      <div class="infobox infobox-blue" style="margin-bottom:12px">Päivittää nimen, puhelimen ja sähköpostin kaikkiin tämän henkilön purjehdus-/tutkinto-osallistumisiin kerralla.</div>
      <div class="field"><label class="lbl">Nimi *</label><input data-bind="personDraft.name" value="${esc(d.name || "")}"></div>
      <div class="grid2">
        <div class="field"><label class="lbl">Puhelin</label><input data-bind="personDraft.phone" value="${esc(d.phone || "")}"></div>
        <div class="field"><label class="lbl">Sähköposti</label><input data-bind="personDraft.email" value="${esc(d.email || "")}"></div>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-action="save-person">Tallenna kaikkiin</button></div>
    </div>
  </div></div>`;
}
