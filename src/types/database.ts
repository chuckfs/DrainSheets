export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json
          org_id: string
          row_id: string | null
          sheet_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json
          org_id: string
          row_id?: string | null
          sheet_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json
          org_id?: string
          row_id?: string | null
          sheet_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          org_id: string
          phone: string | null
          search_vector: unknown
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          org_id: string
          phone?: string | null
          search_vector?: unknown
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          org_id?: string
          phone?: string | null
          search_vector?: unknown
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          org_id: string
          uploaded_by: string | null
          version_no: number
        }
        Insert: {
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id: string
          uploaded_by?: string | null
          version_no: number
        }
        Update: {
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id?: string
          uploaded_by?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          current_version: number
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          org_id: string
          row_id: string | null
          search_vector: unknown
          sheet_id: string
          uploaded_by: string | null
          version_count: number
        }
        Insert: {
          created_at?: string
          current_version?: number
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id: string
          row_id?: string | null
          search_vector?: unknown
          sheet_id: string
          uploaded_by?: string | null
          version_count?: number
        }
        Update: {
          created_at?: string
          current_version?: number
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          org_id?: string
          row_id?: string | null
          search_vector?: unknown
          sheet_id?: string
          uploaded_by?: string | null
          version_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          attachment_ids: string[]
          cc_addresses: string[]
          created_at: string
          error_message: string | null
          id: string
          included_fields: Json
          layout: string
          message: string
          org_id: string
          resend_id: string | null
          row_id: string | null
          sent_by: string
          sheet_id: string | null
          status: string
          subject: string
          to_addresses: string[]
        }
        Insert: {
          attachment_ids?: string[]
          cc_addresses?: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          included_fields?: Json
          layout?: string
          message?: string
          org_id: string
          resend_id?: string | null
          row_id?: string | null
          sent_by: string
          sheet_id?: string | null
          status?: string
          subject: string
          to_addresses: string[]
        }
        Update: {
          attachment_ids?: string[]
          cc_addresses?: string[]
          created_at?: string
          error_message?: string | null
          id?: string
          included_fields?: Json
          layout?: string
          message?: string
          org_id?: string
          resend_id?: string | null
          row_id?: string | null
          sent_by?: string
          sheet_id?: string | null
          status?: string
          subject?: string
          to_addresses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          org_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["favorite_target_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["favorite_target_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["favorite_target_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          org_id: string
          parent_folder_id: string | null
          position: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          org_id: string
          parent_folder_id?: string | null
          position?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          org_id?: string
          parent_folder_id?: string | null
          position?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          org_id: string
          row_id: string | null
          search_vector: unknown
          sheet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          org_id: string
          row_id?: string | null
          search_vector?: unknown
          sheet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          org_id?: string
          row_id?: string | null
          search_vector?: unknown
          sheet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_row_id_fkey"
            columns: ["row_id"]
            isOneToOne: false
            referencedRelation: "rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recent_views: {
        Row: {
          id: string
          org_id: string
          sheet_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          org_id: string
          sheet_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          sheet_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recent_views_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_views_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recent_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rows: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          org_id: string
          position: number
          search_vector: unknown
          sheet_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          org_id: string
          position: number
          search_vector?: unknown
          sheet_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          org_id?: string
          position?: number
          search_vector?: unknown
          sheet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rows_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      shares: {
        Row: {
          created_at: string
          created_by: string | null
          grantee_id: string
          id: string
          org_id: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["share_resource_type"]
          role: Database["public"]["Enums"]["access_role"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grantee_id: string
          id?: string
          org_id: string
          resource_id: string
          resource_type: Database["public"]["Enums"]["share_resource_type"]
          role: Database["public"]["Enums"]["access_role"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grantee_id?: string
          id?: string
          org_id?: string
          resource_id?: string
          resource_type?: Database["public"]["Enums"]["share_resource_type"]
          role?: Database["public"]["Enums"]["access_role"]
        }
        Relationships: [
          {
            foreignKeyName: "shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_grantee_id_fkey"
            columns: ["grantee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shares_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_columns: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_pinned: boolean
          is_primary: boolean
          key: string
          label: string
          org_id: string
          position: number
          sheet_id: string
          type: Database["public"]["Enums"]["column_type"]
          updated_at: string
          width: number | null
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_primary?: boolean
          key: string
          label: string
          org_id: string
          position: number
          sheet_id: string
          type: Database["public"]["Enums"]["column_type"]
          updated_at?: string
          width?: number | null
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_primary?: boolean
          key?: string
          label?: string
          org_id?: string
          position?: number
          sheet_id?: string
          type?: Database["public"]["Enums"]["column_type"]
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sheet_columns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_columns_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_template_versions: {
        Row: {
          columns: Json
          created_at: string
          id: string
          seed_rows: Json | null
          template_id: string
          version: number
        }
        Insert: {
          columns: Json
          created_at?: string
          id?: string
          seed_rows?: Json | null
          template_id: string
          version: number
        }
        Update: {
          columns?: Json
          created_at?: string
          id?: string
          seed_rows?: Json | null
          template_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sheet_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sheet_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          org_id: string
          role: Database["public"]["Enums"]["access_role"]
          sheet_id: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["access_role"]
          sheet_id: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["access_role"]
          sheet_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_share_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_share_links_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: true
            referencedRelation: "sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_templates: {
        Row: {
          created_at: string
          created_by: string | null
          current_version: number
          description: string | null
          id: string
          key: string
          name: string
          org_id: string | null
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          id?: string
          key: string
          name: string
          org_id?: string | null
          scope: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version?: number
          description?: string | null
          id?: string
          key?: string
          name?: string
          org_id?: string | null
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sheets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          folder_id: string | null
          id: string
          name: string
          org_id: string
          position: number
          search_vector: unknown
          status: Database["public"]["Enums"]["sheet_status"]
          template_id: string | null
          template_version: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          name: string
          org_id: string
          position?: number
          search_vector?: unknown
          status?: Database["public"]["Enums"]["sheet_status"]
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          folder_id?: string | null
          id?: string
          name?: string
          org_id?: string
          position?: number
          search_vector?: unknown
          status?: Database["public"]["Enums"]["sheet_status"]
          template_id?: string | null
          template_version?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sheet_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspaces_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      access_role_level: {
        Args: { role: Database["public"]["Enums"]["access_role"] }
        Returns: number
      }
      can_access_favorite_target: {
        Args: {
          target_id: string
          target_type: Database["public"]["Enums"]["favorite_target_type"]
        }
        Returns: boolean
      }
      can_access_folder: { Args: { check_folder_id: string }; Returns: boolean }
      can_access_sheet: { Args: { check_sheet_id: string }; Returns: boolean }
      can_access_workspace: {
        Args: { check_workspace_id: string }
        Returns: boolean
      }
      can_delete_document_storage: {
        Args: { check_user_id?: string; path: string }
        Returns: boolean
      }
      current_profile: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          name: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_org_id: { Args: never; Returns: string }
      default_organization_id: { Args: never; Returns: string }
      documents_storage_path_document_id: {
        Args: { path: string }
        Returns: string
      }
      documents_storage_path_org_id: { Args: { path: string }; Returns: string }
      documents_storage_path_sheet_id: {
        Args: { path: string }
        Returns: string
      }
      effective_role_for_folder: {
        Args: { check_folder_id: string; check_user_id?: string }
        Returns: Database["public"]["Enums"]["access_role"]
      }
      effective_role_for_sheet: {
        Args: { check_sheet_id: string; check_user_id?: string }
        Returns: Database["public"]["Enums"]["access_role"]
      }
      effective_role_for_workspace: {
        Args: { check_user_id?: string; check_workspace_id: string }
        Returns: Database["public"]["Enums"]["access_role"]
      }
      folder_ancestor_ids: {
        Args: { start_folder_id: string }
        Returns: string[]
      }
      has_access_role: {
        Args: {
          effective: Database["public"]["Enums"]["access_role"]
          min_role: Database["public"]["Enums"]["access_role"]
        }
        Returns: boolean
      }
      has_folder_access: {
        Args: {
          check_folder_id: string
          check_user_id?: string
          min_role: Database["public"]["Enums"]["access_role"]
        }
        Returns: boolean
      }
      has_org_role: {
        Args: { min_role: Database["public"]["Enums"]["org_role"] }
        Returns: boolean
      }
      has_sheet_access: {
        Args: {
          check_sheet_id: string
          check_user_id?: string
          min_role: Database["public"]["Enums"]["access_role"]
        }
        Returns: boolean
      }
      has_workspace_access: {
        Args: {
          check_user_id?: string
          check_workspace_id: string
          min_role: Database["public"]["Enums"]["access_role"]
        }
        Returns: boolean
      }
      is_org_admin: { Args: { check_user_id?: string }; Returns: boolean }
      is_org_member: { Args: { check_org_id: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_actor_id: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_org_id: string
          p_row_id?: string
          p_sheet_id?: string
          p_workspace_id?: string
        }
        Returns: string
      }
      max_access_role: {
        Args: { roles: Database["public"]["Enums"]["access_role"][] }
        Returns: Database["public"]["Enums"]["access_role"]
      }
      org_role_level: {
        Args: { role: Database["public"]["Enums"]["org_role"] }
        Returns: number
      }
      search_global: {
        Args: {
          result_limit?: number
          result_offset?: number
          search_query: string
        }
        Returns: {
          entity_id: string
          entity_type: string
          rank: number
          sheet_id: string
          title: string
          workspace_id: string
        }[]
      }
      sheet_id_for_row: { Args: { check_row_id: string }; Returns: string }
    }
    Enums: {
      access_role: "viewer" | "commenter" | "editor" | "admin" | "owner"
      column_type:
        | "text"
        | "long_text"
        | "number"
        | "currency"
        | "date"
        | "url"
        | "email"
        | "phone"
        | "select"
        | "checkbox"
        | "contact"
      favorite_target_type: "workspace" | "folder" | "sheet"
      org_role: "owner" | "admin" | "editor"
      share_resource_type: "workspace" | "folder" | "sheet"
      sheet_status: "active" | "archived"
      user_status: "active" | "invited" | "disabled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_role: ["viewer", "commenter", "editor", "admin", "owner"],
      column_type: [
        "text",
        "long_text",
        "number",
        "currency",
        "date",
        "url",
        "email",
        "phone",
        "select",
        "checkbox",
        "contact",
      ],
      favorite_target_type: ["workspace", "folder", "sheet"],
      org_role: ["owner", "admin", "editor"],
      share_resource_type: ["workspace", "folder", "sheet"],
      sheet_status: ["active", "archived"],
      user_status: ["active", "invited", "disabled"],
    },
  },
} as const

