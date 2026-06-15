import type { Database } from "./database";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type UserStatus = Database["public"]["Enums"]["user_status"];
export type PropertyStatus = Database["public"]["Enums"]["property_status"];
export type ProspectStatus = Database["public"]["Enums"]["prospect_status"];

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type Prospect = Database["public"]["Tables"]["prospects"]["Row"];
export type Contact = Database["public"]["Tables"]["contacts"]["Row"];
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type Note = Database["public"]["Tables"]["notes"]["Row"];
export type PropertyAssignment = Database["public"]["Tables"]["property_assignments"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Activity = Database["public"]["Tables"]["activity"]["Row"];
