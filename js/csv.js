// Suomalainen Excel-yhteensopiva CSV: puolipiste-erotin, pilkku desimaalierottimena.
function csvField(v) {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function csvNumber(n) {
  return String(Number(n) || 0).replace(".", ",");
}

export function downloadCsv(filename, headerRow, rows) {
  const lines = [headerRow, ...rows].map(row => row.map(csvField).join(";"));
  const blob = new Blob(["﻿" + lines.join("\r\n")], {type: "text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
