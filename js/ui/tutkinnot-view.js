import {esc, fmtDate} from "../format.js";
import {TUTKINTO_TYPES} from "../state.js";

export function renderTutkinnotView(state) {
  const term = (state.searchTutkinnot || "").toLowerCase();
  const list = state.tutkinnot.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter(t => !term || (t.type || "").toLowerCase().includes(term) || (t.date || "").includes(term) || (t.notes || "").toLowerCase().includes(term));
  const typeCounts = {};
  for (const t of state.tutkinnot) typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;

  return `<div class="card">
    <div class="row-between"><div><div class="card-title">🎓 Tutkinnot</div><div class="card-sub">Suoritetut näyttökokeet ja pätevyydet</div></div><button class="btn btn-primary" data-action="new-tutkinto">+ Uusi tutkinto</button></div>
    ${state.tutkinnot.length > 0 ? `<div class="stats-grid" style="margin:16px 0">${TUTKINTO_TYPES.map(t => `<div class="stat-card"><div class="stat-label" style="font-size:10px">${esc(t)}</div><div class="stat-val" style="font-size:28px;color:#1e40af">${typeCounts[t] || 0}</div></div>`).join("")}</div>` : ""}
    <div class="hr"></div>
    <div class="field"><label class="lbl">Haku</label><input data-bind="searchTutkinnot" value="${esc(state.searchTutkinnot || "")}" placeholder="Hae tutkintotyypillä tai päivällä…"></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei tutkintoja.</div>` : `
    <table class="table"><thead><tr><th>Päivämäärä</th><th>Tutkintotyyppi</th><th>Osallistujat</th><th>Paikka / Lisätiedot</th><th></th></tr></thead>
      <tbody>${list.map(t => {
        const typeKey = (t.type || "").split(" ")[0];
        const enrolled = state.customers.filter(c => c.tutkintoId === t.id).length;
        const max = Number(t.maxPersons || 0);
        const enrolledStr = max > 0 ? `${enrolled}/${max}` : `${enrolled} hlö`;
        const conf = state.customers.filter(c => c.tutkintoId === t.id && c.reservationStatus === "paid").length;
        const pend = state.customers.filter(c => c.tutkintoId === t.id && c.reservationStatus === "pending").length;
        return `<tr>
          <td style="font-weight:600;white-space:nowrap">${fmtDate(t.date)}</td>
          <td><span class="tutkinto-type-badge tutkinto-${esc(typeKey)}">${esc(t.type || "")}</span>${t.boatType ? `<div class="small muted">${esc(t.boatType)}</div>` : ""}</td>
          <td>
            <span style="font-weight:700">${enrolledStr}</span>
            ${conf > 0 ? `<span class="badge badge-green" style="font-size:10px;margin-left:4px">✓${conf}</span>` : ""}
            ${pend > 0 ? `<span class="badge badge-red" style="font-size:10px;margin-left:2px">●${pend}</span>` : ""}
            ${t.pricePerPerson > 0 ? `<div class="small muted">${Number(t.pricePerPerson).toFixed(0)} €/hlö</div>` : ""}
          </td>
          <td class="small muted">${t.location ? `📍 ${esc(t.location)}<br>` : ""}${esc(t.notes || "")}</td>
          <td><div class="row" style="gap:6px">
            <button class="btn btn-secondary btn-sm" data-action="edit-tutkinto" data-id="${t.id}">Muokkaa</button>
            <button class="btn btn-danger btn-sm" data-action="delete-tutkinto" data-id="${t.id}">Poista</button>
          </div></td>
        </tr>`;
      }).join("")}</tbody>
    </table>`}
  </div>`;
}
