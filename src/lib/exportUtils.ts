import { type CollectionItem } from "@/context/CollectionContext";
import { CATEGORY_LABELS, SPORT_LABELS } from "@/lib/constants";

// ─── HTML escaping ─────────────────────────────────────────────────────────────
// All user-supplied strings must pass through escapeHtml before being
// interpolated into any HTML string. Failure to do so allows stored XSS
// when item names/notes contain HTML or <script> tags.

function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// ─── CSV export ────────────────────────────────────────────────────────────────

function escapeCsvField(field: string | number): string {
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportCSV(items: CollectionItem[]) {
  const headers = [
    "Name", "Player", "Team", "Sport", "Year", "Category", "Sub-Category",
    "Condition", "Grade", "Grading Company", "Certification #", "Authentication Company",
    "Purchase Price", "Estimated Value", "Recent Sale Price",
    "Storage Location", "Date Acquired",
    "Purchased From", "Origin", "Previous Owners", "Event Details", "Supporting Evidence",
    "Notes",
  ];

  const rows = items.map((item) => [
    item.name,
    item.player,
    item.team,
    SPORT_LABELS[item.sport] ?? item.sport,
    item.year,
    CATEGORY_LABELS[item.category] ?? item.category,
    item.subCategory,
    item.condition,
    item.grade,
    item.gradingCompany,
    item.certificationNumber,
    item.authenticationCompany,
    item.purchasePrice,
    item.estimatedValue,
    item.recentSalePrice,
    item.storageLocation,
    item.dateAcquired,
    item.purchasedFrom,
    item.origin,
    item.previousOwners,
    item.eventDetails,
    item.supportingEvidence,
    item.notes,
  ]);

  const csv = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  downloadFile(csv, "relic-roster-collection.csv", "text/csv");
}

// ─── PDF / Insurance HTML report ──────────────────────────────────────────────

function buildReportHTML(items: CollectionItem[], title: string, includeInsurance: boolean): string {
  const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
  const totalCost  = items.reduce((sum, item) => sum + item.purchasePrice,  0);
  const totalGain  = totalValue - totalCost;

  const itemRows = items.map((item) => {
    // Every user-supplied value is escaped before touching the DOM.
    const name        = escapeHtml(item.name);
    const player      = escapeHtml(item.player);
    const team        = escapeHtml(item.team);
    const sport       = escapeHtml(SPORT_LABELS[item.sport] ?? item.sport);
    const category    = escapeHtml(CATEGORY_LABELS[item.category] ?? item.category);
    const year        = escapeHtml(item.year);
    const condition   = escapeHtml(item.condition);
    const grade       = escapeHtml(item.grade);
    const gradingCo   = escapeHtml(item.gradingCompany);
    const certNum     = escapeHtml(item.certificationNumber);
    const authCo      = escapeHtml(item.authenticationCompany);
    const storage     = escapeHtml(item.storageLocation);
    const dateAcq     = escapeHtml(item.dateAcquired);
    const purchFrom   = escapeHtml(item.purchasedFrom);
    const origin      = escapeHtml(item.origin);
    const prevOwners  = escapeHtml(item.previousOwners);
    const eventDets   = escapeHtml(item.eventDetails);
    const suppEvid    = escapeHtml(item.supportingEvidence);
    const notes       = escapeHtml(item.notes);

    const imageHtml = item.images.length > 0
      ? `<div style="display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0;margin-bottom:12px;">
           ${item.images.map((img) => `<img src="${escapeHtml(img)}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;" />`).join("")}
         </div>`
      : "";

    const provenanceRows = [
      purchFrom   ? `<tr><td style="padding:3px 8px;color:#666;width:40%;">Purchased From</td><td>${purchFrom}</td></tr>` : "",
      origin      ? `<tr><td style="padding:3px 8px;color:#666;">Origin</td><td>${origin}</td></tr>` : "",
      eventDets   ? `<tr><td style="padding:3px 8px;color:#666;">Event</td><td>${eventDets}</td></tr>` : "",
      prevOwners  ? `<tr><td style="padding:3px 8px;color:#666;">Previous Owners</td><td style="white-space:pre-wrap;">${prevOwners}</td></tr>` : "",
      suppEvid    ? `<tr><td style="padding:3px 8px;color:#666;">Supporting Evidence</td><td style="white-space:pre-wrap;">${suppEvid}</td></tr>` : "",
    ].join("");

    return `
    <div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid;">
      ${imageHtml}
      <h3 style="margin:0 0 8px;font-size:16px;">${name}</h3>
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="padding:3px 8px;color:#666;width:40%;">Player</td><td>${player || "—"}</td></tr>
        <tr><td style="padding:3px 8px;color:#666;">Team</td><td>${team || "—"}</td></tr>
        <tr><td style="padding:3px 8px;color:#666;">Sport / Category</td><td>${sport} · ${category}</td></tr>
        <tr><td style="padding:3px 8px;color:#666;">Year</td><td>${year || "—"}</td></tr>
        <tr><td style="padding:3px 8px;color:#666;">Condition / Grade</td><td>${condition}${grade ? ` (${grade})` : ""}</td></tr>
        ${gradingCo ? `<tr><td style="padding:3px 8px;color:#666;">Grading Company</td><td>${gradingCo}</td></tr>` : ""}
        ${certNum   ? `<tr><td style="padding:3px 8px;color:#666;">Certification #</td><td>${certNum}</td></tr>` : ""}
        ${authCo    ? `<tr><td style="padding:3px 8px;color:#666;">Authentication</td><td>${authCo}</td></tr>` : ""}
        ${includeInsurance ? `
          <tr><td style="padding:3px 8px;color:#666;">Purchase Price</td><td>$${item.purchasePrice.toLocaleString()}</td></tr>
          <tr><td style="padding:3px 8px;color:#666;">Estimated Value</td><td><strong>$${item.estimatedValue.toLocaleString()}</strong></td></tr>
          <tr><td style="padding:3px 8px;color:#666;">Recent Sale Price</td><td>$${item.recentSalePrice.toLocaleString()}</td></tr>
        ` : `
          <tr><td style="padding:3px 8px;color:#666;">Estimated Value</td><td><strong>$${item.estimatedValue.toLocaleString()}</strong></td></tr>
        `}
        ${storage   ? `<tr><td style="padding:3px 8px;color:#666;">Storage</td><td>${storage}</td></tr>` : ""}
        ${dateAcq   ? `<tr><td style="padding:3px 8px;color:#666;">Date Acquired</td><td>${dateAcq}</td></tr>` : ""}
        ${provenanceRows}
        ${notes     ? `<tr><td style="padding:3px 8px;color:#666;">Notes</td><td style="white-space:pre-wrap;">${notes}</td></tr>` : ""}
      </table>
    </div>`;
  }).join("");

  const escapedTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapedTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 32px;
      color: #1a1a1a;
    }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1 style="font-size:22px;margin-bottom:4px;">${escapedTitle}</h1>
  <p style="color:#666;margin-top:0;">Generated on ${new Date().toLocaleDateString()}</p>

  <div style="background:#f5f5f5;border-radius:8px;padding:16px;margin-bottom:24px;">
    <table style="width:100%;font-size:14px;">
      <tr>
        <td><strong>Total Items:</strong> ${items.length}</td>
        <td><strong>Total Value:</strong> $${totalValue.toLocaleString()}</td>
        ${includeInsurance ? `
          <td><strong>Total Cost:</strong> $${totalCost.toLocaleString()}</td>
          <td><strong>Total Gain:</strong> $${totalGain.toLocaleString()}</td>
        ` : ""}
      </tr>
    </table>
  </div>

  ${itemRows}

  ${includeInsurance ? `
    <div style="margin-top:32px;padding:16px;border:2px solid #b8860b;border-radius:8px;page-break-inside:avoid;">
      <h3 style="margin:0 0 8px;">Insurance Declaration</h3>
      <p style="font-size:13px;color:#444;">
        This report certifies that the above ${items.length} items have a combined estimated value of
        <strong>$${totalValue.toLocaleString()}</strong> as of ${new Date().toLocaleDateString()}.
        Values are based on recent comparable sales and professional grading assessments.
      </p>
    </div>
  ` : ""}
</body>
</html>`;
}

// ─── Public export functions ──────────────────────────────────────────────────

export function exportPDF(items: CollectionItem[]) {
  const html = buildReportHTML(items, "Relic Roster — Collection Report", false);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

export function exportInsurance(items: CollectionItem[]) {
  const html = buildReportHTML(items, "Relic Roster — Insurance Report", true);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
