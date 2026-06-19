/**
 * Seeds a dev workspace, tenant prospect sheet, columns, and sample rows.
 * Run: npm run db:seed-dev
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

config({ path: ".env.local" });

const TEMPLATE_ID = "10000000-0000-0000-0000-000000000002";

const TEMPLATE_COLUMNS: Array<{
  key: string;
  label: string;
  type: Database["public"]["Enums"]["column_type"];
  position: number;
  is_primary: boolean;
  is_pinned: boolean;
  width: number | null;
  config: Record<string, unknown>;
}> = [
  {
    key: "company",
    label: "Company",
    type: "text",
    position: 0,
    is_primary: true,
    is_pinned: true,
    width: null,
    config: {},
  },
  {
    key: "contact",
    label: "Contact",
    type: "contact",
    position: 1,
    is_primary: false,
    is_pinned: true,
    width: null,
    config: {},
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    position: 2,
    is_primary: false,
    is_pinned: true,
    width: null,
    config: {
      options: [
        { value: "researching", label: "Researching", color: "#6b7280" },
        { value: "contacted", label: "Contacted", color: "#3b82f6" },
        { value: "interested", label: "Interested", color: "#22c55e" },
        { value: "passed", label: "Passed", color: "#ef4444" },
        { value: "closed", label: "Closed", color: "#8b5cf6" },
      ],
    },
  },
  {
    key: "use",
    label: "Use",
    type: "text",
    position: 3,
    is_primary: false,
    is_pinned: false,
    width: null,
    config: {},
  },
  {
    key: "website",
    label: "Website",
    type: "url",
    position: 4,
    is_primary: false,
    is_pinned: false,
    width: null,
    config: {},
  },
  {
    key: "comments",
    label: "Comments",
    type: "long_text",
    position: 5,
    is_primary: false,
    is_pinned: false,
    width: null,
    config: {},
  },
];

const SAMPLE_ROWS = [
  {
    company: "FreshBite Kitchen",
    status: "researching",
    use: "Restaurant",
    website: "https://freshbite.example.com",
    comments: "Inbound referral from broker network.",
  },
  {
    company: "Urban Grind Coffee",
    status: "contacted",
    use: "Coffee",
    website: "https://urbangrind.example.com",
    comments: "Sent LOI template.",
  },
  {
    company: "Pediatric Partners",
    status: "interested",
    use: "Medical",
    website: "https://pediatricpartners.example.com",
    comments: "Tour scheduled next week.",
  },
  {
    company: "StyleHub Boutique",
    status: "passed",
    use: "Retail",
    website: "https://stylehub.example.com",
    comments: "Square footage too small.",
  },
  {
    company: "Pure Yoga Studio",
    status: "closed",
    use: "Fitness",
    website: "https://pureyoga.example.com",
    comments: "Lease executed.",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (orgError || !org) {
    throw new Error(orgError?.message ?? "No organization found. Sign up or run db:reset first.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("org_id", org.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "No profile found for organization.");
  }

  const { data: existingWorkspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("org_id", org.id)
    .eq("name", "Dev Workspace")
    .maybeSingle();

  let workspaceId = existingWorkspace?.id;

  if (!workspaceId) {
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({
        org_id: org.id,
        name: "Dev Workspace",
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (workspaceError) {
      throw new Error(workspaceError.message);
    }

    workspaceId = workspace.id;
  }

  const { data: existingSheet } = await supabase
    .from("sheets")
    .select("id, name")
    .eq("workspace_id", workspaceId)
    .eq("name", "Tenant Prospects")
    .maybeSingle();

  let sheetId = existingSheet?.id;

  if (!sheetId) {
    const { data: sheet, error: sheetError } = await supabase
      .from("sheets")
      .insert({
        org_id: org.id,
        workspace_id: workspaceId,
        name: "Tenant Prospects",
        description: "Sample tenant prospect list from system template",
        template_id: TEMPLATE_ID,
        template_version: 1,
        position: 0,
        created_by: profile.id,
      })
      .select("id")
      .single();

    if (sheetError) {
      throw new Error(sheetError.message);
    }

    sheetId = sheet.id;

    const resolvedSheetId = sheetId;

    const { error: columnsError } = await supabase.from("sheet_columns").insert(
      TEMPLATE_COLUMNS.map((column) => ({
        ...column,
        config: column.config as Database["public"]["Tables"]["sheet_columns"]["Insert"]["config"],
        sheet_id: resolvedSheetId,
        org_id: org.id,
      })),
    );

    if (columnsError) {
      throw new Error(columnsError.message);
    }

    const { error: rowsError } = await supabase.from("rows").insert(
      SAMPLE_ROWS.map((data, position) => ({
        sheet_id: resolvedSheetId,
        org_id: org.id,
        position,
        data,
        created_by: profile.id,
      })),
    );

    if (rowsError) {
      throw new Error(rowsError.message);
    }
  }

  console.log("Dev sheet seed complete.");
  console.log(`Workspace ID: ${workspaceId}`);
  console.log(`Sheet ID:     ${sheetId}`);
  console.log(`Browse:       /workspaces/${workspaceId}`);
  console.log(`Open sheet:   /sheets/${sheetId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
