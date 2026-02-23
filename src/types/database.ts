export interface Client {
  client_id: number;
  name: string;
  domicile: string;
  email: string;
  phone: string;
  address: string;
}

export interface Investor {
  investor_id: number;
  investor_type: string;
  name: string;
  client_id: number;
  tax_number: string;
  address: string;
}

export interface Property {
  property_id: number;
  name: string;
  entity: string;
  gp: string;
  investment_date: string;
  exit_date: string | null;
  asset_class: string;
  strategy: string;
  property_class: string;
  msa: string;
  state: string;
  units: number | null;
  buildings: number | null;
  beds: string | null;
  website: string | null;
  lat: number | null;
  lon: number | null;
  investment_thesis: string | null;
  vo2_raise: number;
  total_equity: number;
  total_debt: number;
  purchase_price: number;
  projected_lp_irr: number;
  projected_irr: number;
  projected_multiple: number;
  senior_loan_rate: number;
}

export interface Valuation {
  valuation_id: number;
  property_id: number;
  date: string;
  units_outstanding: number;
  nav: number;
  nav_per_unit: number;
}

export interface Transaction {
  transaction_id: number;
  date: string;
  investor_id: number;
  property_id: number;
  type: string;
  cash_amount: number;
  units: number | null;
  nav_per_unit: number | null;
  notes: string | null;
}

export interface Metric {
  metric_id: number;
  property_id: number;
  as_of_date: string;
  metric_type: string;
  metric_value: number;
  units: string;
  notes: string | null;
}

export interface PropertyLocation {
  location_id: number;
  property_id: number;
  label: string | null;
  lat: number;
  lon: number;
  type: string;
}

/** Property with its latest valuation NAV joined in */
export interface PropertyWithNav extends Property {
  latest_nav?: number | null;
}
