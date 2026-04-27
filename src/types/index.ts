export interface Company {
  id: string;
  name: string;
  tax_id?: string;
  country?: string;
  created_at: string;
}

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
}

export interface Project {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  destination_country?: string;
  status: 'active' | 'closed';
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  project_id?: string | null;
  company_id: string;
  user_id: string;
  date?: string;
  supplier?: string;
  total_amount?: number;
  tax_amount?: number;
  net_amount?: number;
  tax_id?: string;
  currency: string;
  category?: string;
  country?: string;
  notes?: string;
  file_url?: string;
  raw_ocr_text?: string;
  ai_raw_response?: Record<string, unknown>;
  created_at: string;
}

export interface AIExtracted {
  date: string | null;
  total_amount: string | null;
  tax_amount: string | null;
  net_amount: string | null;
  supplier: string | null;
  tax_id: string | null;
  currency: string | null;
  country: string | null;
  category: string | null;
  raw_text: string | null;
  confidence: Record<string, number>;
}
