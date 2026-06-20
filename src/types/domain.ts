import type { Database, Json } from "./database";

export type OrgRole = Database["public"]["Enums"]["org_role"];
export type AccessRole = Database["public"]["Enums"]["access_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type SheetStatus = Database["public"]["Enums"]["sheet_status"];
export type ColumnType = Database["public"]["Enums"]["column_type"];
export type ShareResourceType = Database["public"]["Enums"]["share_resource_type"];

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Workspace = Database["public"]["Tables"]["workspaces"]["Row"];
export type Folder = Database["public"]["Tables"]["folders"]["Row"];
export type Sheet = Database["public"]["Tables"]["sheets"]["Row"];
export type SheetColumn = Database["public"]["Tables"]["sheet_columns"]["Row"];
export type Row = Database["public"]["Tables"]["rows"]["Row"];
export type Share = Database["public"]["Tables"]["shares"]["Row"];
export type SheetTemplate = Database["public"]["Tables"]["sheet_templates"]["Row"];
export type SheetTemplateVersion = Database["public"]["Tables"]["sheet_template_versions"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentVersion = Database["public"]["Tables"]["document_versions"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Activity = Database["public"]["Tables"]["activity"]["Row"];
export type SheetView = Database["public"]["Tables"]["sheet_views"]["Row"];

export type RowData = Record<string, Json | undefined>;
