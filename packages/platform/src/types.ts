export type ProductStatus = "active" | "preview" | "planned";
export type WorkspaceKind = "internal" | "demo" | "client";
export type WorkspaceStatus = "active" | "paused" | "archived";

export type PlatformRole =
  | "platform_owner"
  | "platform_team"
  | "demo_viewer"
  | "client_admin"
  | "client_member";

export interface ProductDefinition {
  id: string;
  name: string;
  description: string;
  status: ProductStatus;
  localUrl: string;
  environmentVariable: string;
  iconPath: string;
}

export interface WorkspaceDefinition {
  id: string;
  slug: string;
  name: string;
  kind: WorkspaceKind;
  status: WorkspaceStatus;
  templateId: string;
  enabledProductIds: string[];
  branding: {
    initials: string;
    accentColor: string;
  };
  resettable?: boolean;
}

export interface TenantContext {
  workspace: WorkspaceDefinition;
  product: ProductDefinition;
  template: WorkspaceTemplate;
  isDemo: boolean;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  productId: string;
  enabledModules: string[];
  demoDataSet?: string;
}

export interface ProductAccessGrant {
  workspaceId: string;
  productId: string;
  roles: PlatformRole[];
}

export interface IntegrationDefinition {
  id: string;
  name: string;
  category: "identity" | "finance" | "productivity" | "communication" | "data";
  scope: "platform" | "workspace";
  status: "ready" | "planned";
}
