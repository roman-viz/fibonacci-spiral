import { ArrowDown, ArrowRight } from 'lucide-react';
import { homeHighlights, pageNavigationIndices } from '../../models/PageContentConstants';
import { PageText } from '../../models/PageText';

interface HomePageProps {
  onNavigate: (index: number) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <section className="content home-content">
      <div className="hero-copy">
        <h1>{PageText.HomeHeadingFirst}<br /><em>{PageText.HomeHeadingAccent}</em><br />{PageText.HomeHeadingLast}</h1>
        <p className="intro">{PageText.HomeIntro}</p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => onNavigate(pageNavigationIndices.services)}>
            {PageText.HomeServicesButton} <ArrowDown size={16} />
          </button>
          <button className="secondary-button" type="button" onClick={() => onNavigate(pageNavigationIndices.contact)}>
            {PageText.HomeConsultationButton} <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div className="hero-highlights">
        {homeHighlights.map(({ value, label, icon: Icon }) => (
          <div className="hero-highlight" key={value}>
            <div className="hero-highlight-value">
              <Icon className="hero-highlight-icon" size={19} strokeWidth={1.8} aria-hidden="true" />
              <strong>{value}</strong>
            </div>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
