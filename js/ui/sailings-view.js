import {esc, fmtDate} from "../format.js";
import {SAILING_GROUPS} from "../state.js";
import {confirmedCount, pendingCount, reserveCount} from "../sailings.js";

function groupCounts(state) {
  const c = {};
  for (const g of SAILING_GROUPS) c[g.id] = g.types ? state.sailings.filter(s => g.types.includes(s.type)).length : state.sailings.length;
  return c;
}

function fillBar(state, s) {
  const max = Math.max(1, Number(s.maxPersons || 0) || 1), rsv = Math.max(0, Number(s.reserveSlots || 0) || 0);
  const conf = confirmedCount(state, s.id), pend = pendingCount(state, s.id), rsvd = reserveCount(state, s.id);
  const confPct = Math.min(100, Math.round((conf / (max + rsv)) * 100));
  const pendPct = Math.min(100 - confPct, Math.round((pend / (max + rsv)) * 100));
  return `<div class="fillrow"><div class="fillbar-wrap"><div class="fillbar-green" style="width:${confPct}%"></div><div class="fillbar-amber" style="width:${pendPct}%"></div></div><div class="filltext"><span style="color:#166534">✓${conf}</span>${pend > 0 ? `<span style="color:#991b1b"> ●${pend}</span>` : ""}${rsvd > 0 ? `<span style="color:#92400e"> ◎${rsvd}</span>` : ""}<span style="color:#6b7280"> / ${max}+${rsv}</span></div></div>`;
}

export function renderSailingsView(state) {
  const counts = groupCounts(state);
  const g = SAILING_GROUPS.find(x => x.id === state.sailingGroup) || SAILING_GROUPS[0];
  const term = (state.searchSailings || "").toLowerCase();
  let list = state.sailings.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (g.types) list = list.filter(s => g.types.includes(s.type));
  if (term) list = list.filter(s => (s.name || "").toLowerCase().includes(term) || (s.type || "").toLowerCase().includes(term) || (s.date || "").includes(term));

  return `<div class="card">
    <div class="row-between"><div><div class="card-title">⛵ Purjehdukset</div><div class="card-sub">Hallitse purjehdukset ja kurssipäivät</div></div><button class="btn btn-primary" data-action="new-sailing">+ Uusi purjehdus</button></div>
    <div class="hr"></div>
    <div class="groupbar">${SAILING_GROUPS.map(x => `<button class="btn ${state.sailingGroup === x.id ? "btn-primary" : "btn-secondary"}" data-action="set-group" data-id="${x.id}">${esc(x.label)} (${counts[x.id] || 0})</button>`).join("")}</div>
    <div class="hr"></div>
    <div class="field"><label class="lbl">Haku</label><input data-bind="searchSailings" value="${esc(state.searchSailings || "")}" placeholder="Hae nimellä, tyypillä tai päivällä…"></div>
    ${list.length === 0 ? `<div class="infobox infobox-blue">Ei purjehduksia tässä ryhmässä.</div>` : list.map(s => {
      const max = Number(s.maxPersons || 0), rsv = Number(s.reserveSlots || 0), resFee = Number(s.reservationFee || 0);
      const isMultiDay = s.endDate && s.endDate > s.date;
      let dateLabel = fmtDate(s.date);
      if (isMultiDay) {
        const days = Math.round((new Date(s.endDate + "T12:00:00") - new Date(s.date + "T12:00:00")) / 86400000) + 1;
        dateLabel = `${fmtDate(s.date)} – ${fmtDate(s.endDate)} (${days} vrk)`;
        if (s.startTime) dateLabel += ` · lähtö ${s.startTime}`;
        if (s.endTime) dateLabel += ` · paluu ${s.endTime}`;
      } else if (s.startTime && s.endTime) dateLabel += ` klo ${s.startTime}–${s.endTime}`;
      else if (s.startTime) dateLabel += ` klo ${s.startTime}`;
      const reittiMeta = s.reitti ? ` · 📍 ${esc(s.reitti)}` : "";
      return `<div class="item"><div style="flex:1"><h3>${esc(s.name || "")} <span class="pill">${esc(s.type || "")}</span>${isMultiDay ? `<span class="badge badge-navy" style="margin-left:6px;font-size:10px">⚓ Merimatka</span>` : ""}${s.kansainvalinen ? `<span class="badge badge-blue" style="margin-left:6px;font-size:10px">🌍 ALV 0%</span>` : ""}</h3><div class="meta">${dateLabel}${reittiMeta} · Max ${max}+${rsv} vara · ${Number(s.pricePerPerson || 0).toFixed(0)} €/hlö${resFee > 0 ? ` · varausmaksu ${resFee} €` : ""}</div>${fillBar(state, s)}</div><div class="row" style="align-items:flex-start;flex-shrink:0"><button class="btn btn-secondary btn-sm" data-action="copy-sailing" data-id="${s.id}" title="Kopioi pohjaksi uudelle">📋</button><button class="btn btn-secondary btn-sm" data-action="edit-sailing" data-id="${s.id}">Muokkaa</button><button class="btn btn-danger btn-sm" data-action="delete-sailing" data-id="${s.id}">Poista</button></div></div>`;
    }).join("")}
  </div>`;
}
