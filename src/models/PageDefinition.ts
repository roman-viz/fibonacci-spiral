import type { PageKind } from './PageKind';

export interface PageDefinition {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  kind: PageKind;
}
