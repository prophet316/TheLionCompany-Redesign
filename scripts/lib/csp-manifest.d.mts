export type CspManifest = {
  readonly version: 1;
  readonly routes: Readonly<Record<string, readonly string[]>>;
  readonly fallback: readonly string[];
};

export function coversCspManifest(compiled: CspManifest, emitted: CspManifest): boolean;
export function mergeCspManifests(left: CspManifest, right: CspManifest): CspManifest;
