export function filePathToRoute(filePath: string, projectRoot: string): string {
  const normalizedRoot = projectRoot.replace(/\/$/, "");
  const prefix = `${normalizedRoot}/`;

  if (!filePath.startsWith(prefix)) {
    return "/";
  }

  const rel = filePath.slice(prefix.length);
  if (!rel.startsWith("src/routes/")) {
    return "/";
  }

  let route = rel.replace(/^src\/routes/, "").replace(/\/?\+page\.svelte$/, "");

  if (!route.startsWith("/")) {
    route = `/${route}`;
  }

  return route || "/";
}
