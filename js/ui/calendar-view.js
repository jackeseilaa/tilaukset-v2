import {esc, today, addDays} from "../format.js";
import {enrolledCount} from "../sailings.js";
import {tutkintoEnrolledCount} from "../tutkinnot.js";

function buildEventMap(state) {
  const eventMap = {};
  const timeToMin = tl => { if (!tl) return 9999; const m = tl.match(/(\d{1,2})[:.](\d{2})/); if (!m) return 9999; return parseInt(m[1]) * 60 + parseInt(m[2]); };
  const addEv = (ds, ev) => { if (!eventMap[ds]) eventMap[ds] = []; eventMap[ds].push(ev); eventMap[ds].sort((a, b) => timeToMin(a.timeLabel) - timeToMin(b.timeLabel)); };

  for (const s of state.sailings) {
    if (!s.date) continue;
    const isMultiDay = s.endDate && s.endDate > s.date;
    if (isMultiDay) {
      let cur = new Date(s.date + "T12:00:00");
      const endD = new Date(s.endDate + "T12:00:00");
      let dayIdx = 0;
      const totalDays = Math.round((endD - cur) / 86400000) + 1;
      while (cur <= endD) {
        const ds = cur.toISOString().slice(0, 10);
        const isFirst = dayIdx === 0, isLast = dayIdx === totalDays - 1;
        const tlBase = isFirst ? (s.startTime ? "lähtö " + s.startTime : "lähtö") : isLast ? (s.endTime ? "paluu " + s.endTime : "paluu") : `vrk ${dayIdx + 1}/${totalDays}`;
        const mdClass = isFirst ? "multiday-start" : isLast ? "multiday-end" : "multiday-mid";
        addEv(ds, {id: s.id, name: s.name, type: s.type, maxPersons: s.maxPersons, reitti: isFirst ? (s.reitti || "") : "", timeLabel: tlBase, _isMultiDay: true, _mdClass: mdClass});
        cur.setDate(cur.getDate() + 1); dayIdx++;
      }
    } else {
      let tl = ""; if (s.startTime && s.endTime) tl = s.startTime + "–" + s.endTime; else if (s.startTime) tl = "klo " + s.startTime;
      addEv(s.date, {id: s.id, name: s.name, type: s.type, maxPersons: s.maxPersons, reitti: s.reitti || "", timeLabel: tl});
    }
  }
  for (const t of state.tutkinnot) {
    if (!t.date) continue;
    let tl = ""; if (t.startTime && t.endTime) tl = t.startTime + "–" + t.endTime; else if (t.startTime) tl = "klo " + t.startTime;
    const name = (t.type || "Tutkinto") + (t.boatType ? " (" + t.boatType + ")" : "");
    addEv(t.date, {id: t.id, name, type: "Tutkinto", maxPersons: t.maxPersons, reitti: t.location || "", timeLabel: tl, _isTutkinto: true});
  }
  for (const b of state.blockedDays) {
    if (!b.date) continue;
    let tl = ""; if (b.startTime && b.endTime) tl = b.startTime + "–" + b.endTime; else if (b.startTime) tl = "klo " + b.startTime;
    addEv(b.date, {id: b.id, name: b.note || "Varattu", type: "blocked", timeLabel: tl, _isBlocked: true});
  }
  return eventMap;
}

const TYPES = ["Kurssi", "Charter", "Iltapurjehdus", "Päiväpurjehdus", "Purjehdusretki", "Yritystilaisuus", "Muu", "Tutkinto"];

function renderMonthGrid(state, eventMap) {
  const [year, month] = state.calendarMonth.split("-").map(Number);
  const monthNames = ["Tammikuu", "Helmikuu", "Maaliskuu", "Huhtikuu", "Toukokuu", "Kesäkuu", "Heinäkuu", "Elokuu", "Syyskuu", "Lokakuu", "Marraskuu", "Joulukuu"];
  const dayNames = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();
  const todayStr = today();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  let cells = "";
  for (let i = 0; i < totalCells; i++) {
    let d, m, y, other = false;
    if (i < startOffset) { d = daysInPrev - startOffset + i + 1; m = month === 1 ? 12 : month - 1; y = month === 1 ? year - 1 : year; other = true; }
    else if (i >= startOffset + daysInMonth) { d = i - startOffset - daysInMonth + 1; m = month === 12 ? 1 : month + 1; y = month === 12 ? year + 1 : year; other = true; }
    else { d = i - startOffset + 1; m = month; y = year; }
    const ds = y + "-" + String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const isToday = ds === todayStr;
    const evs = eventMap[ds] || [];
    const blocked = !other && state.blockedDays.find(b => b.date === ds);
    const evHTML = evs.slice(0, 3).map(ev => {
      const tc = "type-" + ev.type + (ev._mdClass ? " " + ev._mdClass : "");
      const isBlocked = !!ev._isBlocked;
      const action = isBlocked ? "edit-block-day" : (ev._isTutkinto ? "edit-tutkinto" : "edit-sailing");
      const cnt = ev._isTutkinto ? tutkintoEnrolledCount(state, ev.id) : enrolledCount(state, ev.id);
      const booked = (isBlocked || ev._isMultiDay) ? "" : ` (${cnt}${ev.maxPersons ? "/" + ev.maxPersons : ""})`;
      const tl = ev.timeLabel ? `<span style="display:block;opacity:.75;font-size:9px">${esc(ev.timeLabel)}</span>` : "";
      const rl = ev.reitti ? `<span style="display:block;opacity:.7;font-size:9px;overflow:hidden;text-overflow:ellipsis">📍${esc(ev.reitti)}</span>` : "";
      return `<button class="cal-event ${tc}" data-action="${action}" data-id="${ev.id}" style="padding:3px 5px">${esc(ev.name)}${booked}${tl}${rl}</button>`;
    }).join("");
    const more = evs.length > 3 ? `<div data-action="cal-day-open" data-date="${ds}" style="font-size:9px;color:#1e40af;padding:1px 4px;cursor:pointer;font-weight:700">+${evs.length - 3} lisää →</div>` : "";
    const toggleBtn = !other ? `<button data-action="toggle-block" data-date="${ds}" style="position:absolute;bottom:3px;right:3px;background:none;border:none;cursor:pointer;font-size:10px;opacity:.4;padding:1px" title="${blocked ? "Poista varaus" : "Merkitse varatuksi"}">${blocked ? "🔓" : "🔒"}</button>` : "";
    cells += `<div class="cal-cell${other ? " other-month" : ""}${isToday ? " today" : ""}${blocked ? " blocked" : ""}" data-action="add-sailing-date" data-date="${ds}" style="position:relative;cursor:pointer" title="+ Uusi purjehdus ${ds}"><div class="cal-date">${d}</div>${evHTML}${more}${toggleBtn}</div>`;
  }
  const prev = month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`;
  return `<div class="row-between">
      <div class="cal-nav-bar"><button class="btn btn-secondary btn-sm" data-action="cal-nav" data-month="${prev}">‹</button><div class="cal-month-label">${monthNames[month - 1]} ${year}</div><button class="btn btn-secondary btn-sm" data-action="cal-nav" data-month="${next}">›</button></div>
      <div class="row">
        <button class="btn btn-secondary btn-sm" data-action="cal-today">Tänään</button>
        <div style="display:flex;gap:2px;border:1.5px solid #d1d5db;border-radius:8px;overflow:hidden">
          <button class="btn btn-sm" data-action="cal-view" data-view="month" style="border-radius:0;border:none;padding:5px 10px;font-size:12px;background:${state.calView === "month" ? "#0a4272" : "#fff"};color:${state.calView === "month" ? "#fff" : "#374151"}">Kuukausi</button>
          <button class="btn btn-sm" data-action="cal-view" data-view="day" style="border-radius:0;border:none;padding:5px 10px;font-size:12px;background:${state.calView === "day" ? "#0a4272" : "#fff"};color:${state.calView === "day" ? "#fff" : "#374151"}">Päivä</button>
        </div>
        <button class="btn btn-secondary btn-sm" data-action="add-block-day" title="Lisää varattu aika kalenteriin">🔒 Estä aika</button>
      </div>
    </div>
    <div class="cal-legend" style="flex-wrap:wrap;gap:6px">${TYPES.map(t => `<div class="cal-legend-item"><div class="cal-legend-dot cal-event type-${t}"></div>${esc(t)}</div>`).join("")}</div>
    <div class="cal-grid">${dayNames.map(d => `<div class="cal-dayname">${d}</div>`).join("")}${cells}</div>`;
}

function renderDayView(state, eventMap) {
  const dateStr = state.calDayDate || today();
  const evs = eventMap[dateStr] || [];
  const d = new Date(dateStr + "T12:00:00");
  const dayNames2 = ["Su", "Ma", "Ti", "Ke", "To", "Pe", "La"];
  const monthNames2 = ["tammikuuta", "helmikuuta", "maaliskuuta", "huhtikuuta", "toukokuuta", "kesäkuuta", "heinäkuuta", "elokuuta", "syyskuuta", "lokakuuta", "marraskuuta", "joulukuuta"];
  const label = dayNames2[d.getDay()] + " " + d.getDate() + ". " + monthNames2[d.getMonth()] + " " + d.getFullYear();
  const prev = addDays(dateStr, -1), next = addDays(dateStr, 1);
  const isToday = dateStr === today();
  const rows = evs.map(ev => {
    const isBlocked = !!ev._isBlocked;
    const action = isBlocked ? "edit-block-day" : (ev._isTutkinto ? "edit-tutkinto" : "edit-sailing");
    const conf = isBlocked ? 0 : (ev._isTutkinto ? tutkintoEnrolledCount(state, ev.id) : enrolledCount(state, ev.id));
    return `<div style="border:1.5px solid #e5e7eb;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#fff">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="cal-event type-${ev.type}" style="font-size:12px;padding:3px 8px;border-radius:6px;width:auto">${esc(ev.name || "")}</span>
        ${ev.timeLabel ? `<span style="font-size:13px;color:#374151;font-weight:600">🕐 ${esc(ev.timeLabel)}</span>` : ""}
        ${ev.reitti ? `<span style="font-size:12px;color:#6b7280">📍 ${esc(ev.reitti)}</span>` : ""}
        <button class="btn btn-secondary btn-sm" data-action="${action}" data-id="${ev.id}" style="font-size:11px;margin-left:auto">Muokkaa →</button>
      </div>
      ${!isBlocked ? `<div style="margin-top:8px;font-size:13px;color:#374151">👥 Ilmoittautuneita: <b>${conf}</b>${ev.maxPersons ? ` / max ${ev.maxPersons}` : ""}</div>` : ""}
    </div>`;
  });
  const empty = evs.length === 0 ? `<div style="text-align:center;padding:40px;color:#9ca3af;font-size:14px">Ei tapahtumia tänä päivänä</div>` : "";
  return `<div class="row-between">
      <div class="cal-nav-bar"><button class="btn btn-secondary btn-sm" data-action="cal-nav" data-month="${state.calendarMonth}">‹ Kuukausi</button></div>
      <div class="row">
        <button class="btn btn-secondary btn-sm" data-action="cal-view" data-view="month">Kuukausi</button>
        <button class="btn btn-secondary btn-sm" data-action="add-sailing-date" data-date="${dateStr}">+ Uusi purjehdus</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin:16px 0">
      <button class="btn btn-secondary btn-sm" data-action="cal-day-nav" data-date="${prev}">‹</button>
      <div style="font-size:16px;font-weight:700;color:${isToday ? "#0a4272" : "#1f2937"};flex:1;text-align:center">${label}${isToday ? ' <span style="font-size:11px;background:#0a4272;color:#fff;border-radius:10px;padding:2px 8px;margin-left:6px">Tänään</span>' : ""}</div>
      <button class="btn btn-secondary btn-sm" data-action="cal-day-nav" data-date="${next}">›</button>
    </div>
    ${rows.join("")}${empty}`;
}

export function renderCalendarView(state) {
  const eventMap = buildEventMap(state);
  return `<div class="card" style="padding:14px 10px;overflow:hidden">
    ${state.calView === "day" ? renderDayView(state, eventMap) : renderMonthGrid(state, eventMap)}
  </div>`;
}
