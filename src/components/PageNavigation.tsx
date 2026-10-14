import { House, Layers3, ListChecks, Mail, type LucideIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { getCameraTransitionDuration } from '../lib/cameraMath';
import type { PageDefinition } from '../models/PageDefinition';
import { PageKind } from '../models/PageKind';
import { PageText } from '../models/PageText';
import ThemeToggle from './ThemeToggle';

const pageIcons: Record<PageKind, LucideIcon> = {
  [PageKind.Home]: House,
  [PageKind.Services]: Layers3,
  [PageKind.Included]: ListChecks,
  [PageKind.Contact]: Mail,
};

interface IndicatorPosition {
  left: number;
  top: number;
  width: number;
  height: number;
  transitionDuration: string;
}

interface PageNavigationProps {
  pages: PageDefinition[];
  activeIndex: number;
  pendingIndex: number | null;
  onNavigate: (index: number) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function PageNavigation({
  pages,
  activeIndex,
  pendingIndex,
  onNavigate,
  theme,
  onToggleTheme,
}: PageNavigationProps) {
  const railRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicatorPosition, setIndicatorPosition] = useState<IndicatorPosition | null>(null);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return undefined;

    const updateIndicator = () => {
      const targetIndex = pendingIndex ?? activeIndex;
      const item = itemRefs.current[targetIndex];
      if (!item) return;

      const railBounds = rail.getBoundingClientRect();
      const itemBounds = item.getBoundingClientRect();
      const isHorizontal = getComputedStyle(rail).flexDirection === 'row';
      const transitionDuration = pendingIndex === null
        || window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? '0ms'
        : `${getCameraTransitionDuration(activeIndex, pendingIndex)}ms`;
      const position = isHorizontal
        ? {
          left: itemBounds.left - railBounds.left + itemBounds.width * 0.22 - 0.25,
          top: itemBounds.top - railBounds.top - 0.25,
          width: itemBounds.width * 0.56 + 0.5,
          height: 2.5,
          transitionDuration,
        }
        : {
          left: itemBounds.left - railBounds.left + 2,
          top: itemBounds.top - railBounds.top + 12,
          width: 3,
          height: Math.max(0, itemBounds.height - 23),
          transitionDuration,
        };

      setIndicatorPosition((current) => (
        current
          && current.left === position.left
          && current.top === position.top
          && current.width === position.width
          && current.height === position.height
          && current.transitionDuration === position.transitionDuration
          ? current
          : position
      ));
    };

    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(rail);
    itemRefs.current.forEach((item) => {
      if (item) resizeObserver.observe(item);
    });
    return () => resizeObserver.disconnect();
  }, [activeIndex, pages.length, pendingIndex]);

  return (
    <aside className="control-panel">
      <button className="brand-mark" type="button" onClick={() => onNavigate(0)} aria-label={PageText.BrandAriaLabel}>
        <span className="brand-monogram" aria-hidden="true">LW</span>
        <span className="brand-copy">
          <span className="brand-name">{PageText.BrandName}</span>
        </span>
      </button>
      <nav className="page-rail" aria-label={PageText.PagesNavigationLabel} ref={railRef}>
        {pages.map((page, index) => {
          const Icon = pageIcons[page.kind];
          const isActive = activeIndex === index;
          const isPending = pendingIndex === index && pendingIndex !== activeIndex;
          return (
            <button
              className={`rail-item${isActive ? ' is-active' : ''}${isPending ? ' is-pending' : ''}`}
              key={page.id}
              ref={(item) => { itemRefs.current[index] = item; }}
              type="button"
              aria-label={`${PageText.PageNavigationAction} ${page.title}`}
              aria-current={isActive ? 'page' : undefined}
              aria-busy={isPending}
              onClick={() => onNavigate(index)}
            >
              <span className="rail-icon"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="rail-title">{page.title}</span>
            </button>
          );
        })}
        {indicatorPosition && (
          <span
            className="rail-indicator"
            aria-hidden="true"
            style={indicatorPosition}
          />
        )}
      </nav>
      <div className="panel-footer">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </aside>
  );
}
