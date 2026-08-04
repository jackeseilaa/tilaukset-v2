import {esc, fmtDate} from "../format.js";

export function renderCustomerModal(state) {
  const editing = !!state.editId;
  const d = state.customerDraft || {};
  const selS = state.sailings.find(x => x.id === d.sailingId);
  const hasFee = selS && Number(selS.reservationFee || 0) > 0;
  const status = d.reservationStatus || "pending";
  return `<div class="overlay"><div class="modal">
    <div class="modal-head"><div class="row-between"><div class="modal-title">${editing ? "Muokkaa asiakasta" : "Uusi asiakas"}</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body">
      <div class="grid2">
        <div class="field"><label class="lbl">Nimi *</label><input data-bind="customerDraft.name" value="${esc(d.name || "")}" autocomplete="off"></div>
        <div class="field"><label class="lbl">Puhelin</label><input data-bind="customerDraft.phone" value="${esc(d.phone || "")}"></div>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Sähköposti</label><input data-bind="customerDraft.email" value="${esc(d.email || "")}"></div>
        <div class="field"><label class="lbl">Purjehdus / kurssi</label>
          <select data-bind="customerDraft.sailingId">
            <option value="">-- Ei valittu --</option>
            ${state.sailings.slice().sort((a, b) => (a.date || "").localeCompare(b.date || "")).map(s => `<option value="${s.id}" ${s.id === d.sailingId ? "selected" : ""}>${esc(s.name)} (${fmtDate(s.date)})</option>`).join("")}
          </select>
        </div>
      </div>
      <div class="field"><label class="lbl">Tutkinto <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">(jos ei purjehdusta — täytä vain toinen)</span></label>
        <select data-bind="customerDraft.tutkintoId">
          <option value="">-- Ei valittu --</option>
          ${state.tutkinnot.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).map(t => `<option value="${t.id}" ${t.id === d.tutkintoId ? "selected" : ""}>${esc(t.type)}${t.boatType ? " (" + esc(t.boatType) + ")" : ""} — ${fmtDate(t.date)}</option>`).join("")}
        </select>
      </div>
      <div class="grid2">
        <div class="field"><label class="lbl">Varausmaksustatus</label>
          <select data-bind="customerDraft.reservationStatus">
            <option value="pending" ${status === "pending" ? "selected" : ""}>● Varausmaksu odottaa</option>
            <option value="paid" ${status === "paid" ? "selected" : ""}>✓ Vahvistettu</option>
            <option value="reserve" ${status === "reserve" ? "selected" : ""}>◎ Varapaikka</option>
          </select>
        </div>
        <div class="field"><label class="lbl">Laskutus</label>
          <select data-bind="customerDraft.billTo">
            <option value="self" ${(d.billTo || "self") === "self" ? "selected" : ""}>Asiakas maksaa itse</option>
            <option value="company" ${d.billTo === "company" ? "selected" : ""}>Yritys maksaa</option>
          </select>
        </div>
      </div>
      ${d.billTo === "company" ? `<div class="field"><label class="lbl">Tilaajayritys</label>
        <select data-bind="customerDraft.companyId">
          <option value="">-- Ei valittu --</option>
          ${state.companies.slice().sort((a, b) => (a.name || "").localeCompare(b.name || "")).map(co => `<option value="${co.id}" ${co.id === d.companyId ? "selected" : ""}>${esc(co.name)}</option>`).join("")}
        </select>
      </div>` : ""}
      ${status === "pending" && hasFee ? `<div class="infobox infobox-amber">⚠️ Varausmaksu ${Number(selS.reservationFee)} € odottaa.</div>` : ""}
      ${status === "paid" ? `<div class="infobox infobox-green">✓ Paikka vahvistettu.</div>` : ""}
      ${status === "reserve" ? `<div class="infobox infobox-amber">◎ Varapaikalla.</div>` : ""}
      <div class="field" style="margin-top:12px">
        <label class="lbl">Laskutusosio <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">(esim. NAPS, Charter, Kurssilaiset)</span></label>
        <input data-bind="customerDraft.laskutusosio" value="${esc(d.laskutusosio || "")}" placeholder="Valinnainen — ryhmittelee laskuttamattomissa">
      </div>
      <div class="field" style="margin-top:12px">
        <label class="lbl">Yksilöllinen hinta (€) <span style="font-weight:400;text-transform:none;font-size:11px;color:#6b7280">— tyhjä = tapahtuman hinta</span></label>
        <input type="number" min="0" step="0.01" data-bind="customerDraft.priceOverride" value="${esc(d.priceOverride || "")}" placeholder="Ylikirjoittaa tapahtuman hinnan">
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn btn-primary" data-action="save-customer">${editing ? "Tallenna muutokset" : "Tallenna"}</button></div>
    </div>
  </div></div>`;
}
