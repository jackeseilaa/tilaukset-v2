const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {defineString} = require("firebase-functions/params");
const nodemailer = require("nodemailer");

const GMAIL_USER = defineString("GMAIL_USER");
const GMAIL_PASS = defineString("GMAIL_PASS");
const ALLOWED_EMAIL = "jacke.seilaa@gmail.com";

exports.sendInvoiceEmail = onCall({
  region: "europe-west1",
  cors: ["https://jackeseilaa.github.io"],
}, async (request) => {
  if (!request.auth || request.auth.token.email !== ALLOWED_EMAIL) {
    throw new HttpsError("permission-denied", "Ei käyttöoikeutta");
  }
  const {to, subject, bodyText, pdfBase64, filename, fromName} = request.data;
  if (!to || !pdfBase64) throw new HttpsError("invalid-argument", "Puuttuvat kentät");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() }
  });
  await transporter.sendMail({
    from: `"${fromName || "J Sailing"}" <${GMAIL_USER.value()}>`,
    to, subject,
    text: bodyText || "",
    attachments: [{
      filename: filename || "lasku.pdf",
      content: Buffer.from(pdfBase64, "base64"),
      contentType: "application/pdf"
    }]
  });
  return {success: true};
});
