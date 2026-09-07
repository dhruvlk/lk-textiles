export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CompanyMemberRow = {
  id: string;
  company_id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  designation: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  mobile: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type EmployeePermissionRow = {
  id: string;
  company_id: string;
  user_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  created_at: string;
  updated_at: string;
};

export type AuditLogRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  employee_name: string | null;
  action: string;
  module: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Json;
  ip_address: string | null;
  created_at: string;
};

export type CompanyRow = {
  id: string;
  user_id: string;
  name: string;
  owner_name: string | null;
  logo_url: string | null;
  stamp_url: string | null;
  gst_number: string | null;
  hsn_code: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  pan_number: string | null;
  tagline: string | null;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  bank_details: string | null;
  upi_id: string | null;
  signature_url: string | null;
  terms_conditions: string | null;
  invoice_terms: string | null;
  delivery_challan_terms: string | null;
  invoice_prefix: string | null;
  delivery_challan_prefix: string | null;
  invoice_start_number: number;
  delivery_challan_start_number: number;
  number_fy_format: 'YYYY' | 'YYYY-YY' | 'none';
  theme_primary: string | null;
  theme_secondary: string | null;
  default_payment_terms: string | null;
  default_gst_type: 'cgst_sgst' | 'igst' | 'none';
  default_unit: string | null;
  default_delivered_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CompanyBankAccountRow = {
  id: string;
  company_id: string;
  bank_name: string;
  account_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch: string | null;
  upi_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  company_id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  company_id: string;
  name: string;
  contact_person: string | null;
  mobile: string | null;
  email: string | null;
  gst_number: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  broker: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  company_id: string;
  name: string;
  hsn_code: string | null;
  unit: string;
  default_rate: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ChallanRow = {
  id: string;
  company_id: string;
  customer_id: string;
  created_by: string | null;
  challan_number: string;
  date: string;
  bill_number: string | null;
  vehicle_number: string | null;
  delivered_by: string | null;
  driver_mobile: string | null;
  delivery_location: string | null;
  broker: string | null;
  payment_within_value: number | null;
  payment_within_unit: string | null;
  payment_terms: string | null;
  due_date: string | null;
  amount_in_words: string | null;
  notes: string | null;
  status: string;
  subtotal: number;
  discount: number;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  other_charges: number;
  grand_total: number;
  payment_status: string;
  payment_received_date: string | null;
  payment_amount_received: number;
  payment_reference: string | null;
  payment_notes: string | null;
  payment_mode: string | null;
  created_at: string;
  updated_at: string;
};

export type ChallanPaymentRow = {
  id: string;
  challan_id: string;
  company_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string | null;
  reference_number: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type ChallanItemRow = {
  id: string;
  challan_id: string;
  product_id: string | null;
  description: string | null;
  quantity: number | null;
  quantity_display: string | null;
  unit: string | null;
  total_pieces: number;
  quality: string | null;
  fabric_name: string | null;
  color: string | null;
  design: string | null;
  roll_number: string | null;
  lot_number: string | null;
  meter: number | null;
  weight: number | null;
  rate: number | null;
  amount: number | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type ChallanSequenceRow = {
  company_id: string;
  last_number: number;
  updated_at: string;
};

export type DeliveryChallanRow = {
  id: string;
  company_id: string;
  customer_id: string;
  challan_number: string;
  date: string;
  quality: string | null;
  stock_id: string | null;
  broker: string | null;
  delivered_by: string | null;
  remarks: string | null;
  notes: string | null;
  status: string;
  total_pieces: number;
  total_meters: number;
  total_weight: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StockRow = {
  id: string;
  company_id: string;
  quality_name: string;
  total_taka: number;
  sold_taka: number;
  available_taka: number;
  hsn_code: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovementRow = {
  id: string;
  company_id: string;
  stock_id: string;
  transaction_type: string;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reference_type: string | null;
  reference_id: string | null;
  challan_id: string | null;
  delivery_challan_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type DeliveryChallanItemRow = {
  id: string;
  delivery_challan_id: string;
  sort_order: number;
  taka_no: string | null;
  meters: number;
  weight: number;
  created_at: string;
  updated_at: string;
};

export type DeliveryChallanSequenceRow = {
  company_id: string;
  last_number: number;
  updated_at: string;
};

export type InquiryRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: CompanyRow;
        Insert: Omit<CompanyRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          owner_name?: string | null;
          stamp_url?: string | null;
          invoice_prefix?: string | null;
          delivery_challan_prefix?: string | null;
          invoice_start_number?: number;
          delivery_challan_start_number?: number;
          number_fy_format?: 'YYYY' | 'YYYY-YY' | 'none';
          theme_primary?: string | null;
          theme_secondary?: string | null;
          invoice_terms?: string | null;
          delivery_challan_terms?: string | null;
          default_payment_terms?: string | null;
          default_gst_type?: 'cgst_sgst' | 'igst' | 'none';
          default_unit?: string | null;
          default_delivered_by?: string | null;
          upi_id?: string | null;
        };
        Update: Partial<CompanyRow>;
        Relationships: [];
      };
      company_bank_accounts: {
        Row: CompanyBankAccountRow;
        Insert: Omit<CompanyBankAccountRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CompanyBankAccountRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          is_read?: boolean;
        };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: Omit<CustomerRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CustomerRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Omit<ProductRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      challans: {
        Row: ChallanRow;
        Insert: Omit<ChallanRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ChallanRow>;
        Relationships: [];
      };
      challan_items: {
        Row: ChallanItemRow;
        Insert: Omit<ChallanItemRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ChallanItemRow>;
        Relationships: [];
      };
      challan_sequences: {
        Row: ChallanSequenceRow;
        Insert: ChallanSequenceRow;
        Update: Partial<ChallanSequenceRow>;
        Relationships: [];
      };
      challan_payments: {
        Row: ChallanPaymentRow;
        Insert: Omit<ChallanPaymentRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ChallanPaymentRow>;
        Relationships: [];
      };
      delivery_challans: {
        Row: DeliveryChallanRow;
        Insert: Omit<DeliveryChallanRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DeliveryChallanRow>;
        Relationships: [];
      };
      delivery_challan_items: {
        Row: DeliveryChallanItemRow;
        Insert: Omit<DeliveryChallanItemRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<DeliveryChallanItemRow>;
        Relationships: [];
      };
      delivery_challan_sequences: {
        Row: DeliveryChallanSequenceRow;
        Insert: DeliveryChallanSequenceRow;
        Update: Partial<DeliveryChallanSequenceRow>;
        Relationships: [];
      };
      stocks: {
        Row: StockRow;
        Insert: Omit<StockRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<StockRow>;
        Relationships: [];
      };
      stock_movements: {
        Row: StockMovementRow;
        Insert: Omit<StockMovementRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<StockMovementRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at' | 'email' | 'mobile' | 'avatar_url'> & {
          email?: string | null;
          mobile?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      company_members: {
        Row: CompanyMemberRow;
        Insert: Omit<CompanyMemberRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          designation?: string | null;
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<CompanyMemberRow>;
        Relationships: [];
      };
      employee_permissions: {
        Row: EmployeePermissionRow;
        Insert: Omit<EmployeePermissionRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<EmployeePermissionRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
      letter_pads: {
        Row: {
          id: string;
          company_id: string;
          title: string;
          letter_date: string;
          subject: string | null;
          content: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title: string;
          letter_date?: string;
          subject?: string | null;
          content: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          company_id: string;
          title: string;
          letter_date: string;
          subject: string | null;
          content: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "letter_pads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ];
      };
      inquiries: {
        Row: InquiryRow;
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          company?: string | null;
          subject?: string | null;
          message: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<InquiryRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_challan_number: {
        Args: { p_company_id: string };
        Returns: string;
      };
      generate_delivery_challan_number: {
        Args: { p_company_id: string };
        Returns: string;
      };
      process_quality_stock_change: {
        Args: {
          p_company_id: string;
          p_stock_id: string;
          p_delta: number;
          p_transaction_type: string;
          p_reference_type?: string | null;
          p_reference_id?: string | null;
          p_challan_id?: string | null;
          p_delivery_challan_id?: string | null;
          p_notes?: string | null;
          p_user_id?: string | null;
        };
        Returns: undefined;
      };
      register_company_account: {
        Args: {
          p_company_name: string;
          p_owner_name: string;
          p_mobile: string;
          p_gst_number?: string | null;
          p_address?: string | null;
        };
        Returns: string;
      };
      provision_pending_company_account: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      user_belongs_to_company: {
        Args: { p_company_id: string };
        Returns: boolean;
      };
      user_company_role: {
        Args: { p_company_id: string };
        Returns: string | null;
      };
      user_has_module_permission: {
        Args: {
          p_company_id: string;
          p_module: string;
          p_action?: string;
        };
        Returns: boolean;
      };
      list_company_employees: {
        Args: { p_company_id: string };
        Returns: {
          membership_id: string;
          user_id: string;
          company_id: string;
          role: string;
          designation: string | null;
          is_active: boolean;
          invited_by: string | null;
          created_at: string;
          updated_at: string;
          full_name: string;
          email: string;
          mobile: string | null;
          avatar_url: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
