/**
 * Demo database seeder
 *
 * Populates the demo Supabase project with anonymized, realistic data.
 *
 * Usage:
 *   DEMO_SUPABASE_URL=https://xxx.supabase.co \
 *   DEMO_SUPABASE_SERVICE_KEY=your-service-role-key \
 *   npm run seed:demo
 *
 * Get the service role key from: Supabase Dashboard → Settings → API → service_role
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.DEMO_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.DEMO_SUPABASE_SERVICE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Set DEMO_SUPABASE_URL and DEMO_SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insert<T extends object>(table: string, rows: T[]) {
  const { error } = await db.from(table).insert(rows);
  if (error) {
    console.error(`❌  Failed to insert into ${table}:`, error.message);
    process.exit(1);
  }
  console.log(`  ✓  ${table} — ${rows.length} row(s)`);
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const clients = [
  { client_id: 1, name: "Meridian Family Office",  domicile: "Delaware",    email: "info@meridianfo.com",          phone: "+1 (302) 555-0142", address: "1201 Market St, Suite 800, Wilmington, DE 19801" },
  { client_id: 2, name: "Hartwell Ventures LLC",   domicile: "New York",    email: "investments@hartwellvc.com",   phone: "+1 (212) 555-0387", address: "745 Fifth Avenue, 22nd Floor, New York, NY 10151" },
  { client_id: 3, name: "Pacific Crest Capital",   domicile: "California",  email: "contact@pacificcrestcap.com",  phone: "+1 (415) 555-0261", address: "101 California Street, Suite 3500, San Francisco, CA 94111" },
  { client_id: 4, name: "Blue Ridge Partners",     domicile: "Texas",       email: "ops@blueridgepartners.com",    phone: "+1 (512) 555-0194", address: "300 W 6th Street, Suite 1900, Austin, TX 78701" },
];

// ─── Investors ────────────────────────────────────────────────────────────────

const investors = [
  { investor_id: 1, name: "Meridian Family Office",  investor_type: "Family Office", client_id: 1, tax_number: "XX-1234567", address: "1201 Market St, Suite 800, Wilmington, DE 19801" },
  { investor_id: 2, name: "MFO Growth Fund I",        investor_type: "Trust",         client_id: 1, tax_number: "XX-2345678", address: "1201 Market St, Suite 800, Wilmington, DE 19801" },
  { investor_id: 3, name: "Hartwell Ventures LLC",    investor_type: "LLC",           client_id: 2, tax_number: "XX-3456789", address: "745 Fifth Avenue, 22nd Floor, New York, NY 10151" },
  { investor_id: 4, name: "HV Opportunity Fund II",   investor_type: "LP",            client_id: 2, tax_number: "XX-4567890", address: "745 Fifth Avenue, 22nd Floor, New York, NY 10151" },
  { investor_id: 5, name: "Pacific Crest Capital",    investor_type: "LLC",           client_id: 3, tax_number: "XX-5678901", address: "101 California Street, Suite 3500, San Francisco, CA 94111" },
  { investor_id: 6, name: "Blue Ridge Partners",      investor_type: "LP",            client_id: 4, tax_number: "XX-6789012", address: "300 W 6th Street, Suite 1900, Austin, TX 78701" },
  { investor_id: 7, name: "Blue Ridge RE Fund II",    investor_type: "Trust",         client_id: 4, tax_number: "XX-7890123", address: "300 W 6th Street, Suite 1900, Austin, TX 78701" },
];

// ─── Properties ───────────────────────────────────────────────────────────────

const properties = [
  {
    property_id: 1,
    name: "Riverside Commons", entity: "Riverside Commons LLC", gp: "Apex Realty Group",
    investment_date: "2022-03-15", exit_date: null,
    asset_class: "Multifamily", strategy: "Value-Add", property_class: "B+",
    msa: "Austin-Round Rock", state: "TX",
    units: 144, buildings: 4, beds: "1BR / 2BR / 3BR", website: null,
    lat: 30.2115, lon: -97.8651,
    investment_thesis: "144-unit Class B+ multifamily in southwest Austin. 72 units renovated pre-acquisition with proven rent premiums of $150–$200/mo. Planned renovations on remaining 72 units over 24 months, targeting a blended rent premium of $175/mo. Value creation through interior upgrades, amenity improvements, and professional management transition.",
    vo2_raise: 3200000, total_equity: 5800000, total_debt: 9200000, purchase_price: 15000000,
    projected_lp_irr: 14.5, projected_irr: 17.2, projected_multiple: 1.85, senior_loan_rate: 5.25,
  },
  {
    property_id: 2,
    name: "Summit Student Living", entity: "Summit Student Living LLC", gp: "Collegiate Properties Inc",
    investment_date: "2021-08-01", exit_date: null,
    asset_class: "Student Housing", strategy: "Core-Plus", property_class: "A-",
    msa: "Gainesville", state: "FL",
    units: 96, buildings: 2, beds: "2BR / 4BR", website: null,
    lat: 29.6436, lon: -82.3549,
    investment_thesis: "Purpose-built student housing adjacent to the University of Florida, serving a 52,000-student enrollment base. The property benefits from a structurally undersupplied submarket with 98%+ historical occupancy during the academic year. Value-add opportunity through unit interior upgrades and improved digital marketing to capture higher pre-lease rates.",
    vo2_raise: 4800000, total_equity: 8400000, total_debt: 13600000, purchase_price: 22000000,
    projected_lp_irr: 11.8, projected_irr: 14.2, projected_multiple: 1.65, senior_loan_rate: 4.75,
  },
  {
    property_id: 3,
    name: "Parkview Flats", entity: "Parkview Flats LLC", gp: "Skyline Property Group",
    investment_date: "2023-01-20", exit_date: null,
    asset_class: "Multifamily", strategy: "Core", property_class: "A",
    msa: "Nashville-Davidson", state: "TN",
    units: 210, buildings: 6, beds: "Studio / 1BR / 2BR", website: null,
    lat: 36.1627, lon: -86.7816,
    investment_thesis: "210-unit Class A multifamily in Nashville's Midtown submarket, newly constructed in 2021. No capital expenditure required. Benefits from Nashville's strong in-migration, job growth, and limited new supply pipeline. A core hold targeting stable cash yield with modest appreciation over a 7-year hold period.",
    vo2_raise: 6500000, total_equity: 11000000, total_debt: 19000000, purchase_price: 30000000,
    projected_lp_irr: 10.5, projected_irr: 12.8, projected_multiple: 1.55, senior_loan_rate: 5.5,
  },
];

// ─── Valuations (nav_per_unit omitted — it's a generated column) ──────────────

const valuations = [
  // Riverside Commons
  { valuation_id:  1, property_id: 1, date: "2022-06-30", units_outstanding: 3200, nav: 3_200_000 },
  { valuation_id:  2, property_id: 1, date: "2022-12-31", units_outstanding: 3200, nav: 3_296_000 },
  { valuation_id:  3, property_id: 1, date: "2023-06-30", units_outstanding: 3200, nav: 3_424_000 },
  { valuation_id:  4, property_id: 1, date: "2023-12-31", units_outstanding: 3200, nav: 3_584_000 },
  { valuation_id:  5, property_id: 1, date: "2024-06-30", units_outstanding: 3200, nav: 3_776_000 },
  { valuation_id:  6, property_id: 1, date: "2024-12-31", units_outstanding: 3200, nav: 4_000_000 },
  // Summit Student Living
  { valuation_id:  7, property_id: 2, date: "2021-12-31", units_outstanding: 4800, nav: 4_800_000 },
  { valuation_id:  8, property_id: 2, date: "2022-06-30", units_outstanding: 4800, nav: 4_944_000 },
  { valuation_id:  9, property_id: 2, date: "2022-12-31", units_outstanding: 4800, nav: 5_088_000 },
  { valuation_id: 10, property_id: 2, date: "2023-06-30", units_outstanding: 4800, nav: 5_280_000 },
  { valuation_id: 11, property_id: 2, date: "2023-12-31", units_outstanding: 4800, nav: 5_472_000 },
  { valuation_id: 12, property_id: 2, date: "2024-06-30", units_outstanding: 4800, nav: 5_712_000 },
  { valuation_id: 13, property_id: 2, date: "2024-12-31", units_outstanding: 4800, nav: 5_952_000 },
  // Parkview Flats
  { valuation_id: 14, property_id: 3, date: "2023-06-30", units_outstanding: 6500, nav: 6_500_000 },
  { valuation_id: 15, property_id: 3, date: "2023-12-31", units_outstanding: 6500, nav: 6_565_000 },
  { valuation_id: 16, property_id: 3, date: "2024-06-30", units_outstanding: 6500, nav: 6_695_000 },
  { valuation_id: 17, property_id: 3, date: "2024-12-31", units_outstanding: 6500, nav: 6_890_000 },
];

// ─── Transactions (SERIAL primary key — no id needed) ─────────────────────────

const transactions = [
  // Riverside Commons — subscriptions
  { property_id: 1, investor_id: 1, date: "2022-03-15", type: "Subscription", cash_amount: 1_600_000, units: 1600, nav_per_unit: 1000, notes: null },
  { property_id: 1, investor_id: 3, date: "2022-03-15", type: "Subscription", cash_amount:   960_000, units:  960, nav_per_unit: 1000, notes: null },
  { property_id: 1, investor_id: 5, date: "2022-03-15", type: "Subscription", cash_amount:   640_000, units:  640, nav_per_unit: 1000, notes: null },
  // Riverside Commons — distributions
  { property_id: 1, investor_id: 1, date: "2022-12-31", type: "Distribution", cash_amount:  48_000, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 1, investor_id: 3, date: "2022-12-31", type: "Distribution", cash_amount:  28_800, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 1, investor_id: 5, date: "2022-12-31", type: "Distribution", cash_amount:  19_200, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 1, investor_id: 1, date: "2023-06-30", type: "Distribution", cash_amount:  56_000, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 1, investor_id: 3, date: "2023-06-30", type: "Distribution", cash_amount:  33_600, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 1, investor_id: 5, date: "2023-06-30", type: "Distribution", cash_amount:  22_400, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 1, investor_id: 1, date: "2023-12-31", type: "Distribution", cash_amount:  64_000, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 1, investor_id: 3, date: "2023-12-31", type: "Distribution", cash_amount:  38_400, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 1, investor_id: 5, date: "2023-12-31", type: "Distribution", cash_amount:  25_600, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 1, investor_id: 1, date: "2024-06-30", type: "Distribution", cash_amount:  72_000, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 1, investor_id: 3, date: "2024-06-30", type: "Distribution", cash_amount:  43_200, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 1, investor_id: 5, date: "2024-06-30", type: "Distribution", cash_amount:  28_800, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 1, investor_id: 1, date: "2024-12-31", type: "Distribution", cash_amount:  80_000, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 1, investor_id: 3, date: "2024-12-31", type: "Distribution", cash_amount:  48_000, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 1, investor_id: 5, date: "2024-12-31", type: "Distribution", cash_amount:  32_000, units: null, nav_per_unit: null, notes: "H2 2024" },

  // Summit Student Living — subscriptions
  { property_id: 2, investor_id: 2, date: "2021-08-01", type: "Subscription", cash_amount: 2_400_000, units: 2400, nav_per_unit: 1000, notes: null },
  { property_id: 2, investor_id: 4, date: "2021-08-01", type: "Subscription", cash_amount: 1_440_000, units: 1440, nav_per_unit: 1000, notes: null },
  { property_id: 2, investor_id: 6, date: "2021-08-01", type: "Subscription", cash_amount:   960_000, units:  960, nav_per_unit: 1000, notes: null },
  // Summit — distributions
  { property_id: 2, investor_id: 2, date: "2022-06-30", type: "Distribution", cash_amount:  72_000, units: null, nav_per_unit: null, notes: "H1 2022" },
  { property_id: 2, investor_id: 4, date: "2022-06-30", type: "Distribution", cash_amount:  43_200, units: null, nav_per_unit: null, notes: "H1 2022" },
  { property_id: 2, investor_id: 6, date: "2022-06-30", type: "Distribution", cash_amount:  28_800, units: null, nav_per_unit: null, notes: "H1 2022" },
  { property_id: 2, investor_id: 2, date: "2022-12-31", type: "Distribution", cash_amount:  84_000, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 2, investor_id: 4, date: "2022-12-31", type: "Distribution", cash_amount:  50_400, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 2, investor_id: 6, date: "2022-12-31", type: "Distribution", cash_amount:  33_600, units: null, nav_per_unit: null, notes: "H2 2022" },
  { property_id: 2, investor_id: 2, date: "2023-06-30", type: "Distribution", cash_amount:  96_000, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 2, investor_id: 4, date: "2023-06-30", type: "Distribution", cash_amount:  57_600, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 2, investor_id: 6, date: "2023-06-30", type: "Distribution", cash_amount:  38_400, units: null, nav_per_unit: null, notes: "H1 2023" },
  { property_id: 2, investor_id: 2, date: "2023-12-31", type: "Distribution", cash_amount: 108_000, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 2, investor_id: 4, date: "2023-12-31", type: "Distribution", cash_amount:  64_800, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 2, investor_id: 6, date: "2023-12-31", type: "Distribution", cash_amount:  43_200, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 2, investor_id: 2, date: "2024-06-30", type: "Distribution", cash_amount: 120_000, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 2, investor_id: 4, date: "2024-06-30", type: "Distribution", cash_amount:  72_000, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 2, investor_id: 6, date: "2024-06-30", type: "Distribution", cash_amount:  48_000, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 2, investor_id: 2, date: "2024-12-31", type: "Distribution", cash_amount: 132_000, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 2, investor_id: 4, date: "2024-12-31", type: "Distribution", cash_amount:  79_200, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 2, investor_id: 6, date: "2024-12-31", type: "Distribution", cash_amount:  52_800, units: null, nav_per_unit: null, notes: "H2 2024" },

  // Parkview Flats — subscriptions
  { property_id: 3, investor_id: 7, date: "2023-01-20", type: "Subscription", cash_amount: 3_250_000, units: 3250, nav_per_unit: 1000, notes: null },
  { property_id: 3, investor_id: 1, date: "2023-01-20", type: "Subscription", cash_amount: 1_950_000, units: 1950, nav_per_unit: 1000, notes: null },
  { property_id: 3, investor_id: 3, date: "2023-01-20", type: "Subscription", cash_amount: 1_300_000, units: 1300, nav_per_unit: 1000, notes: null },
  // Parkview — distributions
  { property_id: 3, investor_id: 7, date: "2023-12-31", type: "Distribution", cash_amount:  65_000, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 3, investor_id: 1, date: "2023-12-31", type: "Distribution", cash_amount:  39_000, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 3, investor_id: 3, date: "2023-12-31", type: "Distribution", cash_amount:  26_000, units: null, nav_per_unit: null, notes: "H2 2023" },
  { property_id: 3, investor_id: 7, date: "2024-06-30", type: "Distribution", cash_amount:  78_000, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 3, investor_id: 1, date: "2024-06-30", type: "Distribution", cash_amount:  46_800, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 3, investor_id: 3, date: "2024-06-30", type: "Distribution", cash_amount:  31_200, units: null, nav_per_unit: null, notes: "H1 2024" },
  { property_id: 3, investor_id: 7, date: "2024-12-31", type: "Distribution", cash_amount:  91_000, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 3, investor_id: 1, date: "2024-12-31", type: "Distribution", cash_amount:  54_600, units: null, nav_per_unit: null, notes: "H2 2024" },
  { property_id: 3, investor_id: 3, date: "2024-12-31", type: "Distribution", cash_amount:  36_400, units: null, nav_per_unit: null, notes: "H2 2024" },
];

// ─── Metrics (explicit IDs required — not SERIAL) ─────────────────────────────

const metrics = [
  // Riverside Commons — OCCUPANCY
  { metric_id:  1, property_id: 1, as_of_date: "2022-06-30", metric_type: "OCCUPANCY", metric_value: 91.0, units: "PCT", notes: null },
  { metric_id:  2, property_id: 1, as_of_date: "2022-12-31", metric_type: "OCCUPANCY", metric_value: 92.5, units: "PCT", notes: null },
  { metric_id:  3, property_id: 1, as_of_date: "2023-06-30", metric_type: "OCCUPANCY", metric_value: 93.8, units: "PCT", notes: null },
  { metric_id:  4, property_id: 1, as_of_date: "2023-12-31", metric_type: "OCCUPANCY", metric_value: 95.2, units: "PCT", notes: null },
  { metric_id:  5, property_id: 1, as_of_date: "2024-06-30", metric_type: "OCCUPANCY", metric_value: 94.7, units: "PCT", notes: null },
  { metric_id:  6, property_id: 1, as_of_date: "2024-12-31", metric_type: "OCCUPANCY", metric_value: 96.1, units: "PCT", notes: null },
  // Riverside Commons — AVGRENT
  { metric_id:  7, property_id: 1, as_of_date: "2022-06-30", metric_type: "AVGRENT", metric_value: 1240, units: "USD", notes: null },
  { metric_id:  8, property_id: 1, as_of_date: "2022-12-31", metric_type: "AVGRENT", metric_value: 1285, units: "USD", notes: null },
  { metric_id:  9, property_id: 1, as_of_date: "2023-06-30", metric_type: "AVGRENT", metric_value: 1330, units: "USD", notes: null },
  { metric_id: 10, property_id: 1, as_of_date: "2023-12-31", metric_type: "AVGRENT", metric_value: 1375, units: "USD", notes: null },
  { metric_id: 11, property_id: 1, as_of_date: "2024-06-30", metric_type: "AVGRENT", metric_value: 1420, units: "USD", notes: null },
  { metric_id: 12, property_id: 1, as_of_date: "2024-12-31", metric_type: "AVGRENT", metric_value: 1468, units: "USD", notes: null },
  // Riverside Commons — NOI
  { metric_id: 13, property_id: 1, as_of_date: "2022-06-30", metric_type: "NOI", metric_value: 372_000, units: "USD", notes: null },
  { metric_id: 14, property_id: 1, as_of_date: "2022-12-31", metric_type: "NOI", metric_value: 389_000, units: "USD", notes: null },
  { metric_id: 15, property_id: 1, as_of_date: "2023-06-30", metric_type: "NOI", metric_value: 408_000, units: "USD", notes: null },
  { metric_id: 16, property_id: 1, as_of_date: "2023-12-31", metric_type: "NOI", metric_value: 427_000, units: "USD", notes: null },
  { metric_id: 17, property_id: 1, as_of_date: "2024-06-30", metric_type: "NOI", metric_value: 449_000, units: "USD", notes: null },
  { metric_id: 18, property_id: 1, as_of_date: "2024-12-31", metric_type: "NOI", metric_value: 471_000, units: "USD", notes: null },

  // Summit Student Living — OCCUPANCY (seasonal: high H1, softer H2)
  { metric_id: 19, property_id: 2, as_of_date: "2021-12-31", metric_type: "OCCUPANCY", metric_value: 88.5, units: "PCT", notes: null },
  { metric_id: 20, property_id: 2, as_of_date: "2022-06-30", metric_type: "OCCUPANCY", metric_value: 96.8, units: "PCT", notes: null },
  { metric_id: 21, property_id: 2, as_of_date: "2022-12-31", metric_type: "OCCUPANCY", metric_value: 91.2, units: "PCT", notes: null },
  { metric_id: 22, property_id: 2, as_of_date: "2023-06-30", metric_type: "OCCUPANCY", metric_value: 97.4, units: "PCT", notes: null },
  { metric_id: 23, property_id: 2, as_of_date: "2023-12-31", metric_type: "OCCUPANCY", metric_value: 92.6, units: "PCT", notes: null },
  { metric_id: 24, property_id: 2, as_of_date: "2024-06-30", metric_type: "OCCUPANCY", metric_value: 98.1, units: "PCT", notes: null },
  { metric_id: 25, property_id: 2, as_of_date: "2024-12-31", metric_type: "OCCUPANCY", metric_value: 93.5, units: "PCT", notes: null },
  // Summit — AVGRENT
  { metric_id: 26, property_id: 2, as_of_date: "2021-12-31", metric_type: "AVGRENT", metric_value: 1480, units: "USD", notes: null },
  { metric_id: 27, property_id: 2, as_of_date: "2022-06-30", metric_type: "AVGRENT", metric_value: 1535, units: "USD", notes: null },
  { metric_id: 28, property_id: 2, as_of_date: "2022-12-31", metric_type: "AVGRENT", metric_value: 1510, units: "USD", notes: null },
  { metric_id: 29, property_id: 2, as_of_date: "2023-06-30", metric_type: "AVGRENT", metric_value: 1590, units: "USD", notes: null },
  { metric_id: 30, property_id: 2, as_of_date: "2023-12-31", metric_type: "AVGRENT", metric_value: 1565, units: "USD", notes: null },
  { metric_id: 31, property_id: 2, as_of_date: "2024-06-30", metric_type: "AVGRENT", metric_value: 1650, units: "USD", notes: null },
  { metric_id: 32, property_id: 2, as_of_date: "2024-12-31", metric_type: "AVGRENT", metric_value: 1625, units: "USD", notes: null },
  // Summit — NOI
  { metric_id: 33, property_id: 2, as_of_date: "2021-12-31", metric_type: "NOI", metric_value: 498_000, units: "USD", notes: null },
  { metric_id: 34, property_id: 2, as_of_date: "2022-06-30", metric_type: "NOI", metric_value: 556_000, units: "USD", notes: null },
  { metric_id: 35, property_id: 2, as_of_date: "2022-12-31", metric_type: "NOI", metric_value: 524_000, units: "USD", notes: null },
  { metric_id: 36, property_id: 2, as_of_date: "2023-06-30", metric_type: "NOI", metric_value: 608_000, units: "USD", notes: null },
  { metric_id: 37, property_id: 2, as_of_date: "2023-12-31", metric_type: "NOI", metric_value: 571_000, units: "USD", notes: null },
  { metric_id: 38, property_id: 2, as_of_date: "2024-06-30", metric_type: "NOI", metric_value: 662_000, units: "USD", notes: null },
  { metric_id: 39, property_id: 2, as_of_date: "2024-12-31", metric_type: "NOI", metric_value: 623_000, units: "USD", notes: null },

  // Parkview Flats — OCCUPANCY (Class A core, very stable)
  { metric_id: 40, property_id: 3, as_of_date: "2023-06-30", metric_type: "OCCUPANCY", metric_value: 95.5, units: "PCT", notes: null },
  { metric_id: 41, property_id: 3, as_of_date: "2023-12-31", metric_type: "OCCUPANCY", metric_value: 96.2, units: "PCT", notes: null },
  { metric_id: 42, property_id: 3, as_of_date: "2024-06-30", metric_type: "OCCUPANCY", metric_value: 95.8, units: "PCT", notes: null },
  { metric_id: 43, property_id: 3, as_of_date: "2024-12-31", metric_type: "OCCUPANCY", metric_value: 97.1, units: "PCT", notes: null },
  // Parkview — AVGRENT
  { metric_id: 44, property_id: 3, as_of_date: "2023-06-30", metric_type: "AVGRENT", metric_value: 1780, units: "USD", notes: null },
  { metric_id: 45, property_id: 3, as_of_date: "2023-12-31", metric_type: "AVGRENT", metric_value: 1825, units: "USD", notes: null },
  { metric_id: 46, property_id: 3, as_of_date: "2024-06-30", metric_type: "AVGRENT", metric_value: 1870, units: "USD", notes: null },
  { metric_id: 47, property_id: 3, as_of_date: "2024-12-31", metric_type: "AVGRENT", metric_value: 1920, units: "USD", notes: null },
  // Parkview — NOI
  { metric_id: 48, property_id: 3, as_of_date: "2023-06-30", metric_type: "NOI", metric_value: 892_000, units: "USD", notes: null },
  { metric_id: 49, property_id: 3, as_of_date: "2023-12-31", metric_type: "NOI", metric_value: 918_000, units: "USD", notes: null },
  { metric_id: 50, property_id: 3, as_of_date: "2024-06-30", metric_type: "NOI", metric_value: 944_000, units: "USD", notes: null },
  { metric_id: 51, property_id: 3, as_of_date: "2024-12-31", metric_type: "NOI", metric_value: 973_000, units: "USD", notes: null },
];

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding demo database…\n");
  await insert("clients", clients);
  await insert("investors", investors);
  await insert("properties", properties);
  await insert("valuations", valuations);
  await insert("transactions", transactions);
  await insert("metrics", metrics);
  console.log("\n✅  Done! Demo database is ready.");
}

main();
