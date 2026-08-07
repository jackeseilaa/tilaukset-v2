/**
 * J Sailing tilaukset-v2 — laskujen sähköpostilähetys
 *
 * Vastaanottaa POST-pyynnön sovelluksesta (js/email.js) ja lähettää laskun
 * PDF-liitteenä tämän Google-tilin Gmail-lähetyksenä (GmailApp.sendEmail).
 *
 * Käyttöönotto-ohjeet: email-relay/README.md
 */

var SHARED_SECRET = "de2b0872dca046489a03e44e0ec441f27c2b37cd29f344ceb50c8cfd4e2beeda";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.secret !== SHARED_SECRET) {
      return jsonOutput({error: "Ei käyttöoikeutta"});
    }
    if (!data.to || !data.pdfBase64) {
      return jsonOutput({error: "Puuttuvat kentät (to/pdfBase64)"});
    }
    var pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(data.pdfBase64),
      "application/pdf",
      data.filename || "lasku.pdf"
    );
    GmailApp.sendEmail(data.to, data.subject || "Lasku", data.bodyText || "", {
      attachments: [pdfBlob],
      name: data.fromName || "J Sailing"
    });
    return jsonOutput({success: true});
  } catch (err) {
    return jsonOutput({error: String(err)});
  }
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
