import {esc, fmtDate} from "../format.js";

export function renderKyselytView(state) {
  const list = state.kyselyt || [];
  const q = (state.kyselyQ || "").toLowerCase();
  const filtered = q ? list.filter(k => JSON.stringify(k).toLowerCase().includes(q)) : list;
  const sorted = filtered.slice().sort((a, b) => (b.pvm || "").localeCompare(a.pvm || ""));
  const editId = state.kyselyEditId || null;
  const d = state.kyselyDraft || {};
  const tyyppiOpts = ["purjehdus", "tutkinto", "kurssi", "muu"].map(t =>
    `<option value="${t}" ${d.tyyppi === t ? "selected" : ""}>${t.charAt(0).toUpperCase() + t.slice(1)}</option>`
  ).join("");
  return `<div class="card">
    <div class="row-between"><div><div class="card-title">📋 Kyselyt</div><div class="card-sub">Saapuneet tarjouspyynnöt ja kyselyt (${list.length} kpl)</div></div></div>
    <div class="hr"></div>
    <div class="card" style="background:#f8f9fa;margin-bottom:16px">
      <div style="font-weight:700;color:#0a4272;margin-bottom:12px">${editId ? "✏️ Muokkaa kyselyä" : "+ Uusi kysely"}</div>
      <div class="grid2">
        <div class="field"><label class="lbl">Nimi *</label><input data-bind="kyselyDraft.nimi" value="${esc(d.nimi || "")}" placeholder="Etunimi Sukunimi"></div>
        <div class="field"><label class="lbl">Puhelin</label><input data-bind="kyselyDraft.puhelin" value="${esc(d.puhelin || "")}" placeholder="040 1234567"></div>
        <div class="field"><label class="lbl">Sähköposti</label><input data-bind="kyselyDraft.email" value="${esc(d.email || "")}" placeholder="nimi@example.fi"></div>
        <div class="field"><label class="lbl">Tyyppi</label><select data-bind="kyselyDraft.tyyppi">${tyyppiOpts}</select></div>
      </div>
      <div class="field"><label class="lbl">Aihe / mitä kysyi</label><input data-bind="kyselyDraft.aihe" value="${esc(d.aihe || "")}" placeholder="esim. Iltapurjehdus kesäkuu, SP-tutkinto, Kipparikortti…"></div>
      <div class="field"><label class="lbl">Lisätiedot</label><textarea data-bind="kyselyDraft.lisatiedot" rows="2" placeholder="Muuta huomioitavaa, toiveet, ajankohta…">${esc(d.lisatiedot || "")}</textarea></div>
      <div class="field" style="max-width:200px"><label class="lbl">Päivämäärä</label><input type="date" data-bind="kyselyDraft.pvm" value="${esc(d.pvm || "")}"></div>
      <div class="row" style="gap:8px">
        <button class="btn btn-primary" data-action="save-kysely">${editId ? "Tallenna muutokset" : "Tallenna kysely"}</button>
        ${editId ? `<button class="btn btn-secondary" data-action="cancel-kysely">Peruuta</button>` : ""}
      </div>
    </div>
    <div class="field"><input data-bind="kyselyQ" value="${esc(state.kyselyQ || "")}" placeholder="🔍 Hae nimellä, aiheella, tyypillä…"></div>
    ${sorted.length === 0 ? `<div class="infobox infobox-blue">Ei kyselyjä vielä.</div>` : `
    <table class="table">
      <thead><tr><th>Pvm</th><th>Nimi</th><th>Puhelin</th><th>Sähköposti</th><th>Tyyppi</th><th>Aihe</th><th>Lisätiedot</th><th></th></tr></thead>
      <tbody>${sorted.map(k => `<tr style="${editId === k.id ? "background:#fffde7" : ""}">
        <td style="white-space:nowrap">${fmtDate(k.pvm || "")}</td>
        <td style="font-weight:600">${esc(k.nimi || "")}</td>
        <td class="small muted">${esc(k.puhelin || "")}</td>
        <td class="small muted">${esc(k.email || "")}</td>
        <td><span class="badge badge-blue">${esc(k.tyyppi || "")}</span></td>
        <td class="small">${esc(k.aihe || "")}</td>
        <td class="small muted">${esc(k.lisatiedot || "")}</td>
        <td><div class="row" style="gap:4px">
          <button class="btn btn-secondary btn-sm" data-action="edit-kysely" data-id="${k.id}">Muokkaa</button>
          <button class="btn btn-danger btn-sm" data-action="delete-kysely" data-id="${k.id}">Poista</button>
        </div></td>
      </tr>`).join("")}</tbody>
    </table>`}
  </div>`;
}
