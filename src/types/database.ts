import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/invoice";

export type { Invoice, InvoiceItem, InvoiceStatus };

export type UserRole = "ADMIN" | "KUVAR" | "NUTRICIONISTA" | "MAGACIONER";
export type ActivityAction = "CREATE" | "UPDATE" | "DELETE" | "PRINT";
export type ActivityModule =
  | "Magacin"
  | "Jelovnik"
  | "Specijalci"
  | "Interna A"
  | "I Hirurška"
  | "Fakture";

export type LocationCode = "DOBANOVCI" | "GENEKS" | "ZVEZDARA";
export type MealType = "DORUCAK" | "RUCAK" | "VECERA";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  primary_location_id: string | null;
  created_at: string | null;
};

export type Location = {
  id: string;
  name: string;
  code: LocationCode;
  is_active: boolean | null;
  created_at: string | null;
};

export type Product = {
  id: string;
  name: string;
  brand: string | null;
  unit: string;
  barcode: string | null;
  category_id: string | null;
  storage_type: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type Category = {
  id: string;
  name: string;
  created_at: string | null;
};

export type Inventory = {
  id: string;
  product_id: string;
  location_id: string;
  current_stock: number | null;
  min_stock: number | null;
  status: string | null;
};

export type ActivityLog = {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action: ActivityAction;
  module: ActivityModule;
  target_item: string;
  details: string;
  created_at: string;
};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          primary_location_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          primary_location_id?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_primary_location_id_fkey";
            columns: ["primary_location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
        ];
      };
      locations: {
        Row: Location;
        Insert: {
          id?: string;
          name: string;
          code: LocationCode;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          code?: LocationCode;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          name: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: {
          id?: string;
          name: string;
          brand?: string | null;
          unit: string;
          barcode?: string | null;
          category_id?: string | null;
          storage_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          brand?: string | null;
          unit?: string;
          barcode?: string | null;
          category_id?: string | null;
          storage_type?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory: {
        Row: Inventory;
        Insert: {
          id?: string;
          product_id: string;
          location_id: string;
          current_stock?: number | null;
          min_stock?: number | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          location_id?: string;
          current_stock?: number | null;
          min_stock?: number | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: ActivityLog;
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          user_role: UserRole;
          action: ActivityAction;
          module: ActivityModule;
          target_item: string;
          details: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          user_name?: string;
          user_role?: UserRole;
          action?: ActivityAction;
          module?: ActivityModule;
          target_item?: string;
          details?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: Invoice;
        Insert: {
          id?: string;
          invoice_number: string;
          client_id: string;
          client_name: string;
          client_pib: string;
          client_address: string;
          issue_date: string;
          due_date: string;
          period_start: string;
          period_end: string;
          subtotal_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: InvoiceStatus;
          note?: string | null;
          created_by_user_id: string;
          created_by_user_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          client_id?: string;
          client_name?: string;
          client_pib?: string;
          client_address?: string;
          issue_date?: string;
          due_date?: string;
          period_start?: string;
          period_end?: string;
          subtotal_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          status?: InvoiceStatus;
          note?: string | null;
          created_by_user_id?: string;
          created_by_user_name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: {
          id?: string;
          invoice_id: string;
          description: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          description?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      inventory_overview: {
        Row: {
          inventory_id: string | null;
          product_name: string | null;
          location_name: string | null;
          current_stock: number | null;
          min_stock: number | null;
          status: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_current_user_admin: {
        Args: never;
        Returns: boolean;
      };
      log_activity: {
        Args: {
          p_action: ActivityAction;
          p_details: string;
          p_module: string;
          p_target_item: string;
        };
        Returns: string;
      };
      update_inventory_stock_with_activity: {
        Args: {
          p_details?: string;
          p_inventory_id: string;
          p_new_stock: number;
        };
        Returns: {
          current_stock: number;
          id: string;
          min_stock: number;
        }[];
      };
      next_invoice_number: {
        Args: {
          p_year?: number;
        };
        Returns: string;
      };
      delete_user_account: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      location_code: LocationCode;
      meal_type: MealType;
      activity_action: ActivityAction;
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"],
> = PublicSchema["Tables"][TableName]["Update"];

export type Enums<
  EnumName extends keyof PublicSchema["Enums"],
> = PublicSchema["Enums"][EnumName];
