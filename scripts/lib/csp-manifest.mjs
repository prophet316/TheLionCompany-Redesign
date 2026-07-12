function sortedUnion(left, right) {
  return [...new Set([...left, ...right])].sort();
}

export function coversCspManifest(compiled, emitted) {
  const compiledFallback = new Set(compiled.fallback);
  if (emitted.fallback.some((hash) => !compiledFallback.has(hash))) return false;

  for (const [route, hashes] of Object.entries(emitted.routes)) {
    const compiledHashes = compiled.routes[route];
    if (!compiledHashes) return false;
    const allowed = new Set(compiledHashes);
    if (hashes.some((hash) => !allowed.has(hash))) return false;
  }
  return true;
}

export function mergeCspManifests(left, right) {
  const routeNames = [...new Set([
    ...Object.keys(left.routes),
    ...Object.keys(right.routes),
  ])].sort((a, b) => a.localeCompare(b));

  return {
    version: 1,
    routes: Object.fromEntries(routeNames.map((route) => [
      route,
      sortedUnion(left.routes[route] ?? [], right.routes[route] ?? []),
    ])),
    fallback: sortedUnion(left.fallback, right.fallback),
  };
}
