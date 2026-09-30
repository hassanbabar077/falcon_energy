// Shared helpers for printable documents (vouchers & reports).
// Everything is rendered from HTML strings so the on-screen preview and
// the printed page are identical.

export const escapeHTML = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const money = (value, { blankZero = false } = {}) => {
  const n = Math.round((parseFloat(value) || 0) * 100) / 100;
  if (blankZero && n === 0) return '-';
  return n.toLocaleString('en-PK', { maximumFractionDigits: 2 });
};

export const pkr = (value) => `PKR ${money(value)}`;

export const fmtDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(`${String(iso).split('T')[0]}T00:00:00`);
  if (isNaN(d)) return String(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Opens a new window with the given HTML and triggers the print dialog.
export function printHTML({ title, html, css = '', orientation = 'portrait', margin = '10mm' }) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked! Please allow pop-ups to print or save as PDF.');
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHTML(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 ${orientation}; margin: ${margin}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background: #fff; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    ${css}
  </style>
</head>
<body>${html}
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 400); };</script>
</body>
</html>`);
  win.document.close();
}
