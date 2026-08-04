import {esc} from "../format.js";

export function renderCompaniesView(state) {
  const list = state.companies.slice().sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return `<div class="card">
    <div class="row-between">
      <div><div class="card-title">🏢 Tilaajayritykset</div><div class="card-sub">Yritysasiakkaat ja laskutustiedot</div></div>
      <button class="btn btn-primary" data-action="new-company">+ Uusi yritys</button>
    </div>
    <div class="hr"></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei yrityksiä vielä. Lisää ensimmäinen yllä olevalla napilla.</div>` : `
    <table class="table">
      <thead><tr><th>Nimi</th><th>Y-tunnus</th><th>Sähköposti</th><th class="r">Provisio</th><th></th></tr></thead>
      <tbody>${list.map(co => `<tr>
        <td style="font-weight:600">${esc(co.name || "")}</td>
        <td class="small muted">${esc(co.businessId || "—")}</td>
        <td class="small muted">${esc(co.email || "—")}</td>
        <td class="r">${Number(co.commissionPct || 0)} %</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="edit-company" data-id="${co.id}">Muokkaa</button>
          <button class="btn btn-danger btn-sm" data-action="delete-company" data-id="${co.id}">Poista</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>`;
}

export function renderCompanyModal(state) {
  const editing = !!state.editId;
  const d = state.companyDraft || {};
  return `<div class="overlay"><div class="modal" style="max-width:520px">
    <div class="modal-head"><div class="row-between"><div class="modal-title">${editing ? "Muokkaa yritystä" : "Uusi yritys"}</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body">
      <div class="field"><label class="lbl">Yrityksen nimi *</label><input data-bind="companyDraft.name" value="${esc(d.name || "")}"></div>
      <div class="grid2">
        <div class="field"><label class="lbl">Y-tunnus</label><input data-bind="companyDraft.businessId" value="${esc(d.businessId || "")}" placeholder="1234567-8"></div>
        <div class="field"><label class="lbl">Sähköposti</label><input data-bind="companyDraft.email" value="${esc(d.email || "")}" placeholder="laskutus@yritys.fi"></div>
      </div>
      <div class="field"><label class="lbl">Provisio (%)</label><input type="number" min="0" step="0.01" data-bind="companyDraft.commissionPct" value="${esc(String(d.commissionPct ?? 0))}"></div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-action="save-company">${editing ? "Tallenna muutokset" : "Tallenna"}</button></div>
    </div>
  </div></div>`;
}
