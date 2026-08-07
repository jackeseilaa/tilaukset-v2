import {esc} from "../format.js";

export function renderEmailModal(state) {
  const d = state.emailDraft || {};
  const sending = !!state.emailSending;
  return `<div class="overlay"><div class="modal">
    <div class="modal-head"><div class="row-between"><div class="modal-title">✉️ Lähetä lasku sähköpostilla</div><button class="btn btn-secondary btn-sm" data-action="close-modal">✕</button></div></div>
    <div class="modal-body">
      <div class="field"><label class="lbl">Vastaanottaja *</label><input type="email" data-bind="emailDraft.to" value="${esc(d.to || "")}" placeholder="asiakas@esimerkki.fi"></div>
      <div class="field" style="margin-top:10px"><label class="lbl">Aihe</label><input data-bind="emailDraft.subject" value="${esc(d.subject || "")}"></div>
      <div class="field" style="margin-top:10px"><label class="lbl">Viesti</label><textarea data-bind="emailDraft.bodyText" rows="6">${esc(d.bodyText || "")}</textarea></div>
      <div class="infobox infobox-blue" style="margin-top:10px">📎 Lasku liitetään automaattisesti PDF-liitteenä.</div>
      <div class="row" style="justify-content:flex-end;margin-top:16px">
        <button class="btn btn-primary" data-action="send-invoice-email" ${sending ? "disabled" : ""}>${sending ? "Lähetetään…" : "✉️ Lähetä"}</button>
      </div>
    </div>
  </div></div>`;
}
