import { ArrowDown, ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { pageNavigationIndices, services } from '../../models/PageContentConstants';
import { PageText } from '../../models/PageText';

interface ServicesPageProps {
  onNavigate: (index: number) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [mobileDetailsIndex, setMobileDetailsIndex] = useState<number | null>(null);
  const mobileDetailsDialog = useRef<HTMLDialogElement>(null);
  const mobileDetailsService = mobileDetailsIndex === null ? null : services[mobileDetailsIndex];
  const MobileDetailsIcon = mobileDetailsService?.icon;

  useEffect(() => {
    const dialog = mobileDetailsDialog.current;
    if (mobileDetailsService && dialog && !dialog.open) dialog.showModal();
  }, [mobileDetailsService]);

  const updateExpandedIndex = (index: number | null) => {
    const update = () => setExpandedIndex(index);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('startViewTransition' in document)) {
      update();
      return;
    }

    document.startViewTransition(update);
  };
  const serviceGridStyle: CSSProperties & {
    '--tablet-grid-rows'?: string;
    '--mobile-grid-rows'?: string;
  } = expandedIndex === null
    ? {}
    : {
      '--tablet-grid-rows': [1, 2, 3]
        .map((row) => `minmax(0, ${row === Math.floor(expandedIndex / 2) + 1 ? 5 : 1}fr)`)
        .join(' '),
      '--mobile-grid-rows': services
        .map((_, index) => index === expandedIndex ? 'minmax(220px, 3fr)' : 'minmax(72px, .75fr)')
        .join(' '),
    };

  return (
    <section className="content services-content">
      <header className="section-heading">
        <p className="eyebrow">{PageText.ServicesEyebrowLabel}</p>
        <h2>{PageText.ServicesHeadingFirst}<br /><em>{PageText.ServicesHeadingAccent}</em></h2>
        <p>{PageText.ServicesIntro}</p>
      </header>
      <div className={`service-grid${expandedIndex !== null ? ' has-expanded-card' : ''}`} style={serviceGridStyle}>
        {services.map((service, index) => {
          const { name, audience, goal, time, icon: Icon, features, price, unit, featured } = service;
          const isExpanded = expandedIndex === index;
          const detailsId = `service-details-${index}`;
          const compactIndex = index < (expandedIndex ?? -1) ? index : index - 1;
          const compactPositionIndex = Math.max(0, compactIndex);
          const expandedTabletRow = expandedIndex === null ? 1 : Math.floor(expandedIndex / 2) + 1;
          const compactTabletRows = [1, 2, 3].filter((row) => row !== expandedTabletRow);
          const cardStyle: CSSProperties & {
            '--expanded-column'?: string;
            '--compact-column'?: string;
            '--compact-row'?: string;
            '--expanded-tablet-row'?: string;
            '--compact-tablet-column'?: string;
            '--compact-tablet-row'?: string;
            '--mobile-row'?: string;
          } = expandedIndex === null
            ? {}
            : {
              '--expanded-column': expandedIndex % 2 === 0 ? '1' : '2',
              '--compact-column': expandedIndex % 2 === 0 ? '2' : '1',
              '--compact-row': String(compactPositionIndex + 1),
              '--expanded-tablet-row': String(expandedTabletRow),
              '--compact-tablet-column': String((compactPositionIndex % 2) + 1),
              '--compact-tablet-row': String(compactTabletRows[Math.floor(compactPositionIndex / 2)] ?? 1),
              '--mobile-row': String(index + 1),
            };

          return (
            <article
              className={`service-card${featured ? ' is-featured' : ''}${isExpanded ? ' is-expanded' : ''}`}
              key={name}
              style={{ ...cardStyle, viewTransitionName: `service-card-${index}` }}
              tabIndex={isExpanded ? -1 : 0}
              onClick={(event) => {
                if (!isExpanded && !(event.target instanceof Element && event.target.closest('button'))) {
                  if (window.matchMedia('(max-width: 520px)').matches) {
                    setMobileDetailsIndex(index);
                  } else {
                    updateExpandedIndex(index);
                  }
                }
              }}
              onKeyDown={(event) => {
                if (!isExpanded && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  if (window.matchMedia('(max-width: 520px)').matches) {
                    setMobileDetailsIndex(index);
                  } else {
                    updateExpandedIndex(index);
                  }
                }
              }}
            >
              <div className="service-card-toggle">
                <span className="service-summary">
                  <span className="service-card-heading">
                    <span className="service-icon"><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>
                    <span className="service-card-name">
                      {name}
                      {featured && <span className="service-ribbon"><Sparkles size={11} aria-hidden="true" /> {PageText.Recommended}</span>}
                    </span>
                  </span>
                  <span className="service-meta">
                    {isExpanded && <span className="service-time">{time}</span>}
                    <span className="service-card-price">{price} <small>{unit}</small></span>
                  </span>
                </span>
              </div>
              <div className="service-details" id={detailsId} hidden={!isExpanded}>
                <p className="service-description"><strong>Для кого:</strong> {audience}</p>
                <p className="service-goal"><strong>Мета:</strong> {goal}</p>
                <ul className="service-features">
                  {features.map((feature) => (
                    <li key={feature}><Check size={13} strokeWidth={2} aria-hidden="true" />{feature}</li>
                  ))}
                </ul>
              </div>
              <div className={`service-card-actions${isExpanded ? ' is-expanded' : ''}`}>
                {!isExpanded && (
                  <>
                    <span className="service-time">{time}</span>
                    <span className="service-card-price service-card-price-mobile">{price} <small>{unit}</small></span>
                  </>
                )}
                <button
                  className="service-expand-label"
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  onClick={() => {
                    if (window.matchMedia('(max-width: 520px)').matches) {
                      setMobileDetailsIndex(index);
                    } else {
                      updateExpandedIndex(isExpanded ? null : index);
                    }
                  }}
                >
                  {isExpanded ? 'Згорнути' : 'Деталі'}
                  {isExpanded ? <ArrowDown size={13} aria-hidden="true" /> : <ArrowRight size={13} aria-hidden="true" />}
                </button>
                {isExpanded && (
                  <button className="card-link" type="button" onClick={() => onNavigate(pageNavigationIndices.contact)}>
                    {PageText.DiscussProjectButton} <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <dialog
        className="service-details-dialog"
        ref={mobileDetailsDialog}
        aria-labelledby="service-dialog-title"
        onClose={() => setMobileDetailsIndex(null)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            mobileDetailsDialog.current?.close();
          }
        }}
      >
        {mobileDetailsService && (
          <>
            <header className="service-dialog-header">
              <div className="service-dialog-title">
                <span className="service-icon">
                  {MobileDetailsIcon && <MobileDetailsIcon size={22} strokeWidth={1.7} aria-hidden="true" />}
                </span>
                <h2 id="service-dialog-title">{mobileDetailsService.name}</h2>
              </div>
              <button
                className="service-dialog-close"
                type="button"
                aria-label="Закрити деталі"
                onClick={() => mobileDetailsDialog.current?.close()}
              >
                <X size={18} aria-hidden="true" />
              </button>
              <div className="service-dialog-meta">
                <span>{mobileDetailsService.time}</span>
                <span className="service-card-price">
                  {mobileDetailsService.price} <small>{mobileDetailsService.unit}</small>
                </span>
              </div>
            </header>
            <div className="service-dialog-content">
              <p className="service-description"><strong>Для кого:</strong> {mobileDetailsService.audience}</p>
              <p className="service-goal"><strong>Мета:</strong> {mobileDetailsService.goal}</p>
              <ul className="service-features">
                {mobileDetailsService.features.map((feature) => (
                  <li key={feature}><Check size={14} strokeWidth={2} aria-hidden="true" />{feature}</li>
                ))}
              </ul>
            </div>
            <footer className="service-dialog-actions">
              <button
                className="card-link"
                type="button"
                onClick={() => {
                  mobileDetailsDialog.current?.close();
                  onNavigate(pageNavigationIndices.contact);
                }}
              >
                {PageText.DiscussProjectButton} <ArrowRight size={14} aria-hidden="true" />
              </button>
            </footer>
          </>
        )}
      </dialog>
    </section>
  );
}
