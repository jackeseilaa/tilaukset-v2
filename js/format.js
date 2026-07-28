export function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function today() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export function fmtDate(d) {
  return d ? new Date(d + "T00:00:00").toLocaleDateString("fi-FI") : "";
}

export function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fi-FI") + " klo " + d.toLocaleTimeString("fi-FI", {hour: "2-digit", minute: "2-digit"});
}

export function genId(prefix) {
  return (prefix || "X") + Math.random().toString(36).slice(2, 10);
}
