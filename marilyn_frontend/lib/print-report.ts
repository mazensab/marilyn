export type PrintReportLocale = "ar" | "en";
type ApiRecord = Record<string, unknown>;
export type PrintReportOptions = {
  locale: PrintReportLocale;
  title: string;
  subtitle?: string;
  branchName?: string;
  tableHtml: string;
  recordsCount?: number;
  logoUrl?: string;
};
type PrintProfile = {
  companyName: string;
  commercialRegistration: string;
  taxNumber: string;
  phone: string;
  email: string;
  website: string;
  address: string;
};
function isRecord(value: unknown): value is ApiRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asRecord(value: unknown): ApiRecord {
  return isRecord(value) ? value : {};
}
function valueText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}
function escapeHtml(value: unknown): string {
  return valueText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function collectRecords(
  value: unknown,
  depth = 0,
  seen = new Set<object>(),
): ApiRecord[] {
  if (depth > 4) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRecords(item, depth + 1, seen));
  }
  const source = asRecord(value);
  if (!Object.keys(source).length || seen.has(source)) {
    return [];
  }
  seen.add(source);
  const nestedKeys = [
    "data",
    "result",
    "profile",
    "company",
    "organization",
    "organisation",
    "membership",
    "active_company",
    "selected_company",
    "current_company",
    "company_profile",
    "details",
    "settings",
  ];
  return [
    source,
    ...nestedKeys.flatMap((key) =>
      collectRecords(source[key], depth + 1, seen),
    ),
  ];
}
function firstText(
  records: ApiRecord[],
  keys: string[],
  fallback = "",
): string {
  for (const source of records) {
    for (const key of keys) {
      const result = valueText(source[key]);
      if (result) return result;
    }
  }
  return fallback;
}
function uniqueParts(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}
function getApiBaseUrl(): string {
  const envBase = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).replace(/\/+$/, "");
  return envBase.endsWith("/api")
    ? envBase.slice(0, -4)
    : envBase;
}
async function requestJson(path: string): Promise<unknown> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    redirect: "follow",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return {};
  }
}
async function loadPrintProfile(): Promise<PrintProfile> {
  const results = await Promise.allSettled([
    requestJson("/api/company/profile/"),
    requestJson("/api/auth/whoami/"),
  ]);
  const payloads = results
    .filter(
      (result): result is PromiseFulfilledResult<unknown> =>
        result.status === "fulfilled",
    )
    .map((result) => result.value);
  const records = payloads.flatMap((payload) => collectRecords(payload));
  const addressRecords = [
    ...records.flatMap((source) =>
      [
        "national_address",
        "nationalAddress",
        "address_details",
        "address_detail",
        "address_components",
        "addressComponents",
      ].flatMap((key) => collectRecords(source[key])),
    ),
    ...records,
  ];
  const address = uniqueParts([
    firstText(addressRecords, [
      "short_address",
      "shortAddress",
      "registered_address",
      "address",
      "address_line",
    ]),
    firstText(addressRecords, ["street", "street_name"]),
    firstText(addressRecords, ["district", "neighborhood"]),
    firstText(addressRecords, ["building_number", "building_no"]),
    firstText(addressRecords, ["unit_number", "unit_no"]),
    firstText(addressRecords, ["postal_code", "zip_code"]),
    firstText(addressRecords, ["additional_number"]),
    firstText(addressRecords, ["city", "city_name"]),
    firstText(addressRecords, ["country", "country_name"]),
  ]).join("، ");
  return {
    companyName: firstText(
      records,
      [
        "name",
        "company_name",
        "legal_name",
        "display_name",
        "organization_name",
        "organisation_name",
        "title",
      ],
      "Marilyn Clinics",
    ),
    commercialRegistration: firstText(records, [
      "commercial_registration",
      "commercial_registration_number",
      "cr_number",
      "registration_number",
    ]),
    taxNumber: firstText(records, [
      "tax_number",
      "vat_number",
      "tax_id",
      "vat_registration_number",
    ]),
    phone: firstText(records, [
      "phone",
      "phone_number",
      "mobile",
      "telephone",
    ]),
    email: firstText(records, [
      "email",
      "company_email",
      "contact_email",
    ]),
    website: firstText(records, [
      "website",
      "website_url",
      "site_url",
    ]),
    address,
  };
}
function absoluteUrl(path: string): string {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}
export async function openPrintReport(
  options: PrintReportOptions,
): Promise<boolean> {
  const printWindow = window.open(
    "",
    "_blank",
    "width=1400,height=900",
  );
  if (!printWindow) return false;
  const rtl = options.locale === "ar";
  const direction = rtl ? "rtl" : "ltr";
  const labels = rtl
    ? {
        loading: "جارٍ تجهيز التقرير...",
        branch: "الفرع",
        allBranches: "جميع الفروع",
        commercialRegistration: "السجل التجاري",
        taxNumber: "الرقم الضريبي",
        phone: "الهاتف",
        email: "البريد الإلكتروني",
        website: "الموقع الإلكتروني",
        address: "العنوان",
        generatedAt: "تاريخ ووقت الإنشاء",
        recordsCount: "عدد السجلات",
      }
    : {
        loading: "Preparing report...",
        branch: "Branch",
        allBranches: "All branches",
        commercialRegistration: "Commercial registration",
        taxNumber: "Tax number",
        phone: "Phone",
        email: "Email",
        website: "Website",
        address: "Address",
        generatedAt: "Generated at",
        recordsCount: "Records",
      };
  printWindow.document.write(`<!doctype html>
<html dir="${direction}" lang="${options.locale}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(options.title)}</title>
<style>
body{
  font-family:Tahoma,Arial,sans-serif;
  padding:32px;
  color:#111;
  text-align:center;
}
.loading{
  margin-top:120px;
  font-size:18px;
}
</style>
</head>
<body>
<div class="loading">${escapeHtml(labels.loading)}</div>
</body>
</html>`);
  printWindow.document.close();
  let profile: PrintProfile;
  try {
    profile = await loadPrintProfile();
  } catch {
    profile = {
      companyName: "Marilyn Clinics",
      commercialRegistration: "",
      taxNumber: "",
      phone: "",
      email: "",
      website: "",
      address: "",
    };
  }
  if (printWindow.closed) return false;
  const logoUrl = absoluteUrl(
    options.logoUrl || "/logo/marilyn.svg",
  );
  const branchName =
    options.branchName?.trim() || labels.allBranches;
  const generatedAt = new Date().toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const informationRows = [
    profile.commercialRegistration
      ? {
          label: labels.commercialRegistration,
          value: profile.commercialRegistration,
        }
      : null,
    profile.taxNumber
      ? {
          label: labels.taxNumber,
          value: profile.taxNumber,
        }
      : null,
    profile.phone
      ? {
          label: labels.phone,
          value: profile.phone,
        }
      : null,
    profile.email
      ? {
          label: labels.email,
          value: profile.email,
        }
      : null,
    profile.website
      ? {
          label: labels.website,
          value: profile.website,
        }
      : null,
    profile.address
      ? {
          label: labels.address,
          value: profile.address,
        }
      : null,
  ].filter(
    (
      item,
    ): item is {
      label: string;
      value: string;
    } => Boolean(item),
  );
  const informationHtml = informationRows
    .map(
      (item) => `
        <span class="company-detail">
          <strong>${escapeHtml(item.label)}:</strong>
          ${escapeHtml(item.value)}
        </span>
      `,
    )
    .join("");
  const recordsCountHtml =
    typeof options.recordsCount === "number"
      ? `
        <span class="report-chip">
          <strong>${escapeHtml(labels.recordsCount)}:</strong>
          ${options.recordsCount.toLocaleString("en-US")}
        </span>
      `
      : "";
  const html = `<!doctype html>
<html dir="${direction}" lang="${options.locale}">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(options.title)}</title>
<style>
@page{
  size:A4 landscape;
  margin:12mm;
}
*{
  box-sizing:border-box;
}
html{
  direction:${direction};
}
body{
  margin:0;
  color:#111;
  background:#fff;
  font-family:Tahoma,Arial,sans-serif;
  font-size:11px;
  -webkit-print-color-adjust:exact;
  print-color-adjust:exact;
}
.report-header{
  display:grid;
  grid-template-columns:minmax(220px,0.8fr) minmax(0,1.8fr);
  gap:24px;
  align-items:center;
  padding-bottom:14px;
  border-bottom:2px solid #b58c4d;
}
.brand-block{
  display:flex;
  align-items:center;
  gap:14px;
  min-width:0;
}
.brand-logo{
  width:112px;
  height:62px;
  object-fit:contain;
  flex:0 0 auto;
}
.company-name{
  margin:0;
  font-size:17px;
  font-weight:700;
  line-height:1.5;
}
.brand-caption{
  margin-top:3px;
  color:#8f6a37;
  font-size:10px;
}
.report-heading{
  min-width:0;
}
.report-title{
  margin:0;
  font-size:21px;
  font-weight:700;
  line-height:1.5;
}
.report-subtitle{
  margin:4px 0 0;
  color:#555;
  font-size:11px;
}
.report-scope{
  display:flex;
  flex-wrap:wrap;
  gap:6px 14px;
  margin-top:9px;
}
.report-chip{
  display:inline-flex;
  gap:4px;
  align-items:center;
  padding:4px 8px;
  border:1px solid #d8c4a3;
  border-radius:999px;
  background:#faf7f1;
  white-space:nowrap;
}
.company-details{
  display:flex;
  flex-wrap:wrap;
  gap:5px 18px;
  padding:10px 0;
  border-bottom:1px solid #aaa;
  color:#333;
}
.company-detail{
  line-height:1.7;
}
.generated-row{
  display:flex;
  flex-wrap:wrap;
  justify-content:space-between;
  gap:10px;
  margin:9px 0 14px;
  color:#444;
}
.report-content{
  width:100%;
}
.report-content table{
  width:100%;
  border-collapse:collapse;
  table-layout:auto;
}
.report-content thead{
  display:table-header-group;
}
.report-content tr{
  break-inside:avoid;
  page-break-inside:avoid;
}
.report-content th,
.report-content td{
  border:1px solid #000;
  padding:6px 7px;
  vertical-align:middle;
  text-align:${rtl ? "right" : "left"};
  word-break:break-word;
}
.report-content th{
  background:#ececec;
  color:#111;
  font-weight:700;
}
.report-content tbody tr:nth-child(even){
  background:#fafafa;
}
@media print{
  body{
    padding:0;
  }
}
</style>
</head>
<body>
<header class="report-header">
  <div class="brand-block">
    <img
      class="brand-logo"
      src="${escapeHtml(logoUrl)}"
      alt="Marilyn Clinics"
    />
    <div>
      <p class="company-name">${escapeHtml(profile.companyName)}</p>
      <div class="brand-caption">Marilyn Clinics</div>
    </div>
  </div>
  <div class="report-heading">
    <h1 class="report-title">${escapeHtml(options.title)}</h1>
    ${
      options.subtitle
        ? `<p class="report-subtitle">${escapeHtml(options.subtitle)}</p>`
        : ""
    }
    <div class="report-scope">
      <span class="report-chip">
        <strong>${escapeHtml(labels.branch)}:</strong>
        ${escapeHtml(branchName)}
      </span>
      ${recordsCountHtml}
    </div>
  </div>
</header>
${
  informationHtml
    ? `<div class="company-details">${informationHtml}</div>`
    : ""
}
<div class="generated-row">
  <span>
    <strong>${escapeHtml(labels.generatedAt)}:</strong>
    <span dir="ltr">${escapeHtml(generatedAt)}</span>
  </span>
</div>
<main class="report-content">
  ${options.tableHtml}
</main>
<script>
window.addEventListener("load", function () {
  window.setTimeout(function () {
    window.print();
  }, 180);
});
window.addEventListener("afterprint", function () {
  window.close();
});
</script>
</body>
</html>`;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}