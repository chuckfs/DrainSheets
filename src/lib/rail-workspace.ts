export function resolveRailWorkspaceId(
  activeWorkspaceId: string | null,
  pathname: string,
  workspaces: Array<{ id: string }>,
): string | null {
  return (
    activeWorkspaceId ??
    pathname.match(/^\/workspaces\/([^/]+)/)?.[1] ??
    workspaces[0]?.id ??
    null
  );
}
