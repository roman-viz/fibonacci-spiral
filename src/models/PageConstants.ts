import type { PageDefinition } from './PageDefinition';
import { PageKind } from './PageKind';
import { PageText } from './PageText';

export const pages: PageDefinition[] = [
  { id: '01', slug: 'home', title: PageText.HomeTitle, eyebrow: PageText.HomeEyebrow, kind: PageKind.Home },
  { id: '02', slug: 'about', title: PageText.ServicesTitle, eyebrow: PageText.ServicesEyebrow, kind: PageKind.Services },
  { id: '03', slug: 'process', title: PageText.IncludedTitle, eyebrow: PageText.IncludedEyebrow, kind: PageKind.Included },
  { id: '04', slug: 'contact', title: PageText.ContactTitle, eyebrow: PageText.ContactEyebrow, kind: PageKind.Contact },
];

export function indexForSlug(slug: string | undefined): number {
  return pages.findIndex((page) => page.slug === slug);
}
