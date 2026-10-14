import { ShieldCheck } from 'lucide-react';
import { includedItems } from '../../models/PageContentConstants';
import { PageText } from '../../models/PageText';

export default function IncludedPage() {
  return (
    <section className="content included-content">
      <header className="section-heading">
        <p className="eyebrow">{PageText.IncludedEyebrowLabel}</p>
        <h2>{PageText.IncludedHeadingFirst}<br /><em>{PageText.IncludedHeadingAccent}</em></h2>
        <p>{PageText.IncludedIntro}</p>
      </header>
      <div className="included-grid">
        {includedItems.map(({ title, description, icon: Icon }, index) => (
          <article className="included-card" key={title} data-index={index + 1}>
            <div className="included-card-heading">
              <h3>{title}</h3>
            </div>
            <p>{description}</p>
            <span className="included-icon"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
          </article>
        ))}
      </div>
      <p className="included-note"><ShieldCheck size={14} aria-hidden="true" /> {PageText.IncludedNote}</p>
    </section>
  );
}
