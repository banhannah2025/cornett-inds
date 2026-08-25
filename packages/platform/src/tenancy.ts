import { products } from "./products";
import { workspaceTemplates } from "./templates";
import type { TenantContext } from "./types";
import { workspaces } from "./workspaces";

export function resolveTenantContext(
  workspaceSlug: string,
  productId: string,
): TenantContext | undefined {
  const workspace = workspaces.find((item) => item.slug === workspaceSlug);
  const product = products.find((item) => item.id === productId);

  if (
    !workspace ||
    !product ||
    !workspace.enabledProductIds.some(
      (enabledProductId) => enabledProductId === productId,
    )
  ) {
    return undefined;
  }

  const template = workspaceTemplates.find(
    (item) => item.id === workspace.templateId && item.productId === productId,
  );

  if (!template) return undefined;

  return {
    workspace,
    product,
    template,
    isDemo: workspace.kind === "demo",
  };
}
