/**
 * Generated from local schema. Regenerate after migrations:
 * npm run db:types
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      activity: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json | null;
          org_id: string;
          property_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json | null;
          org_id: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          metadata?: Json | null;
          org_id?: string;
          property_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          phone: string | null;
          prospect_id: string;
          search_vector: unknown;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          phone?: string | null;
          prospect_id: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          prospect_id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          created_at: string;
          file_name: string;
          file_path: string;
          file_size: number | null;
          id: string;
          mime_type: string | null;
          property_id: string;
          prospect_id: string | null;
          search_vector: unknown;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          property_id: string;
          prospect_id?: string | null;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          id?: string;
          mime_type?: string | null;
          property_id?: string;
          prospect_id?: string | null;
          uploaded_by?: string | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string | null;
          org_id: string;
          role: Database["public"]["Enums"]["user_role"];
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by?: string | null;
          org_id: string;
          role?: Database["public"]["Enums"]["user_role"];
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string | null;
          org_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          token_hash?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          property_id: string;
          prospect_id: string | null;
          search_vector: unknown;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          property_id: string;
          prospect_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          property_id?: string;
          prospect_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          name: string;
          org_id: string;
          role: Database["public"]["Enums"]["user_role"];
          status: Database["public"]["Enums"]["user_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          name: string;
          org_id: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          org_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          status?: Database["public"]["Enums"]["user_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          org_id: string;
          search_vector: unknown;
          state: string | null;
          status: Database["public"]["Enums"]["property_status"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          org_id: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["property_status"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          state?: string | null;
          status?: Database["public"]["Enums"]["property_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      property_assignments: {
        Row: {
          created_at: string;
          id: string;
          property_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          property_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          property_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      prospects: {
        Row: {
          category: string | null;
          comments: string | null;
          company_name: string;
          created_at: string;
          id: string;
          property_id: string;
          search_vector: unknown;
          status: Database["public"]["Enums"]["prospect_status"] | null;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          category?: string | null;
          comments?: string | null;
          company_name: string;
          created_at?: string;
          id?: string;
          property_id: string;
          status?: Database["public"]["Enums"]["prospect_status"] | null;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          category?: string | null;
          comments?: string | null;
          company_name?: string;
          created_at?: string;
          id?: string;
          property_id?: string;
          status?: Database["public"]["Enums"]["prospect_status"] | null;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_global: {
        Args: {
          result_limit?: number;
          result_offset?: number;
          search_query: string;
        };
        Returns: {
          entity_id: string;
          entity_type: string;
          property_id: string;
          rank: number;
          title: string;
        }[];
      };
    };
    Enums: {
      property_status: "active" | "archived";
      prospect_status: "researching" | "contacted" | "interested" | "passed" | "closed";
      user_role: "owner" | "admin" | "editor";
      user_status: "active" | "invited" | "disabled";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
