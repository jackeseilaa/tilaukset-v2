import {registerAction} from "./dispatch.js";
import {getInvoicePdfBase64} from "./pdf.js";
import {EMAIL_WEBAPP_URL, EMAIL_SECRET, EMAIL_CONFIG_READY} from "./email-config.js";
import {ISSUERS} from "./state.js";

function emptyEmailDraft(inv) {
  const issuerName = (ISSUERS[inv.issuer || "tmi"] || ISSUERS.tmi).name;
  const amount = Number(inv.grossTotal || 0).toFixed(2);
  const kind = inv.isCredit ? "Hyvityslasku" : "Lasku";
  return {
    invoiceId: inv.id,
    to: inv.payerEmail || "",
    subject: `${kind} ${inv.invoiceNo || ""} — ${issuerName}`,
    bodyText: `Hei,\n\nOhessa ${kind.toLowerCase()} ${inv.invoiceNo || ""} (${amount} €).\n\nYstävällisin terveisin,\n${issuerName}`
  };
}

registerAction("open-email-invoice", ({id, store}) => {
  const inv = store.getState().invoices.find(x => x.id === id);
  if (!inv) return;
  if (!EMAIL_CONFIG_READY) { alert("Sähköpostin lähetystä ei ole vielä otettu käyttöön (js/email-config.js täyttämättä)."); return; }
  store.setState({modal: "email", emailDraft: emptyEmailDraft(inv), emailSending: false});
});

registerAction("send-invoice-email", async ({store}) => {
  const state = store.getState();
  const d = state.emailDraft;
  if (!d) return;
  const inv = state.invoices.find(x => x.id === d.invoiceId);
  if (!inv) return;
  if (!d.to || !d.to.includes("@")) { alert("Anna kelvollinen vastaanottajan sähköpostiosoite."); return; }
  store.setState({emailSending: true});
  try {
    const pdfBase64 = await getInvoicePdfBase64(inv);
    if (!pdfBase64) throw new Error("PDF:n luonti epäonnistui.");
    const issuerName = (ISSUERS[inv.issuer || "tmi"] || ISSUERS.tmi).name;
    // Content-Type: text/plain estää selainta lähettämästä CORS-preflightia
    // (OPTIONS-pyyntöä), jota Apps Script Web App ei osaa käsitellä — Apps
    // Script lukee silti e.postData.contents ja parsii sen itse JSON:ksi.
    const res = await fetch(EMAIL_WEBAPP_URL, {
      method: "POST",
      headers: {"Content-Type": "text/plain;charset=utf-8"},
      body: JSON.stringify({
        secret: EMAIL_SECRET,
        to: d.to.trim(),
        subject: d.subject || "",
        bodyText: d.bodyText || "",
        pdfBase64,
        filename: `${(inv.invoiceNo || "lasku").replace(/[^\w.-]/g, "_")}.pdf`,
        fromName: issuerName
      })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json || json.error) throw new Error(json?.error || "Lähetys epäonnistui.");
    store.setState({modal: null, emailDraft: null, emailSending: false});
    alert("Sähköposti lähetetty!");
  } catch (err) {
    store.setState({emailSending: false});
    alert(err.message || "Lähetys epäonnistui.");
  }
});
