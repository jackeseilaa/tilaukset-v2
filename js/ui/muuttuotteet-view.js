import {esc} from "../format.js";

export function renderMuutTuotteetView(state) {
  const list = state.muutTuotteet.slice().sort((a, b) => (a.nimi || "").localeCompare(b.nimi || ""));
  const editing = !!state.muuTuoteDraft;
  const d = state.muuTuoteDraft || {};
  return `<div class="card">
    <div class="row-between">
      <div><div class="card-title">📦 Muut tuotteet ja palvelut</div><div class="card-sub">Tuotteet ja palvelut joita voi lisätä laskuille</div></div>
      <button class="btn btn-primary" data-action="new-muututuote">+ Uusi tuote / palvelu</button>
    </div>
    <div class="hr"></div>
    ${editing ? `<div class="card" style="background:#f0f9ff;border:1.5px solid #93c5fd;margin-bottom:16px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px;color:#0a4272">${state.muuTuoteEditId ? "Muokkaa tuotetta" : "Uusi tuote"}</div>
      <div class="grid2">
        <div class="field"><label class="lbl">Nimi *</label><input data-bind="muuTuoteDraft.nimi" value="${esc(d.nimi || "")}" placeholder="esim. Kurssikirja, Vakuutusmaksu"></div>
        <div class="field"><label class="lbl">Tuoteryhmä</label><input data-bind="muuTuoteDraft.ryhma" value="${esc(d.ryhma || "")}" placeholder="esim. Materiaali, Palvelu"></div>
      </div>
      <div class="grid3">
        <div class="field"><label class="lbl">Hinta (€ sis. ALV)</label><input type="number" min="0" step="0.01" data-bind="muuTuoteDraft.hinta" value="${esc(String(d.hinta || ""))}"></div>
        <div class="field"><label class="lbl">ALV-%</label>
          <select data-bind="muuTuoteDraft.alv">
            <option value="25.5" ${(d.alv || "25.5") === "25.5" ? "selected" : ""}>25,5 %</option>
            <option value="13.5" ${d.alv === "13.5" ? "selected" : ""}>13,5 %</option>
            <option value="0" ${d.alv === "0" ? "selected" : ""}>0 % (veroton)</option>
          </select>
        </div>
        <div class="field"><label class="lbl">Yksikkö</label><input data-bind="muuTuoteDraft.yksikko" value="${esc(d.yksikko || "kpl")}" placeholder="kpl, h, pv…"></div>
      </div>
      <div class="field"><label class="lbl">Kuvaus / lisätiedot</label><textarea data-bind="muuTuoteDraft.kuvaus" rows="2" placeholder="Valinnainen lisäkuvaus laskulle">${esc(d.kuvaus || "")}</textarea></div>
      <div class="row" style="justify-content:flex-end;gap:8px;margin-top:8px">
        <button class="btn btn-secondary btn-sm" data-action="cancel-muututuote">Peruuta</button>
        <button class="btn btn-primary" data-action="save-muututuote">Tallenna</button>
      </div>
    </div>` : ""}
    ${list.length === 0 && !editing ? `<div class="infobox infobox-blue">Ei tuotteita. Lisää ensimmäinen tuote tai palvelu yllä olevalla napilla.</div>` : list.length ? `
    <table class="table">
      <thead><tr><th>Nimi</th><th>Ryhmä</th><th class="r">Hinta</th><th>ALV</th><th>Yksikkö</th><th></th></tr></thead>
      <tbody>${list.map(p => `<tr>
        <td style="font-weight:600">${esc(p.nimi || "")}${p.kuvaus ? `<div class="small muted">${esc(p.kuvaus)}</div>` : ""}</td>
        <td class="small muted">${esc(p.ryhma || "—")}</td>
        <td class="r">${Number(p.hinta || 0).toFixed(2)} €</td>
        <td>${esc(p.alv || "25.5")} %</td>
        <td class="small muted">${esc(p.yksikko || "kpl")}</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="edit-muututuote" data-id="${p.id}">Muokkaa</button>
          <button class="btn btn-danger btn-sm" data-action="delete-muututuote" data-id="${p.id}">Poista</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>` : ""}
  </div>`;
}
