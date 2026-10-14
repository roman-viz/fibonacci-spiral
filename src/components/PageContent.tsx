import type { PageDefinition } from '../models/PageDefinition';
import { PageKind } from '../models/PageKind';
import { PageText } from '../models/PageText';
import ContactPage from './pages/ContactPage';
import HomePage from './pages/HomePage';
import IncludedPage from './pages/IncludedPage';
import ServicesPage from './pages/ServicesPage';

interface PageContentProps {
  page: PageDefinition;
  index: number;
  onNavigate: (index: number) => void;
}

export default function PageContent({ page, index, onNavigate }: PageContentProps) {
  let body;
  switch (page.kind) {
    case PageKind.Home:
      body = <HomePage onNavigate={onNavigate} />;
      break;
    case PageKind.Services:
      body = <ServicesPage onNavigate={onNavigate} />;
      break;
    case PageKind.Included:
      body = <IncludedPage />;
      break;
    case PageKind.Contact:
      body = <ContactPage />;
      break;
  }

  return (
    <article
      className={`spiral-page page-${page.kind}`}
      aria-label={`${page.title} ${PageText.PageAriaLabelSuffix}`}
      data-page-index={index}
    >
      {body}
    </article>
  );
}
