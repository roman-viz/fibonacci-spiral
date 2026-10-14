import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import PageContent from './components/PageContent';
import PageNavigation from './components/PageNavigation';
import { pages } from './models/PageConstants';
import type { SpiralTile } from './lib/fibonacciLayout';
import { getCameraPose } from './lib/cameraMath';
import { useSpiralNavigation } from './hooks/useSpiralNavigation';
import { PageText } from './models/PageText';

type CurtainEdge = 'top' | 'right' | 'bottom' | 'left';

function oppositeCurtainEdge(edge: CurtainEdge): CurtainEdge {
  const oppositeEdges: Record<CurtainEdge, CurtainEdge> = {
    top: 'bottom',
    right: 'left',
    bottom: 'top',
    left: 'right',
  };
  return oppositeEdges[edge];
}

function curtainEdgeFor(tile: SpiralTile, previous: SpiralTile): CurtainEdge {
  const epsilon = 0.001;
  let worldEdge: CurtainEdge;
  if (Math.abs(tile.x + tile.side - previous.x) < epsilon) {
    worldEdge = 'right';
  } else if (Math.abs(tile.x - previous.x - previous.side) < epsilon) {
    worldEdge = 'left';
  } else if (Math.abs(tile.y + tile.side - previous.y) < epsilon) {
    worldEdge = 'bottom';
  } else {
    worldEdge = 'top';
  }

  const angle = -tile.rotationTravelDegrees * Math.PI / 180;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  const normals: Record<CurtainEdge, [number, number]> = {
    top: [0, -1],
    right: [1, 0],
    bottom: [0, 1],
    left: [-1, 0],
  };
  const [worldX, worldY] = normals[worldEdge];
  const localX = cosine * worldX - sine * worldY;
  const localY = sine * worldX + cosine * worldY;

  if (Math.abs(localX) > Math.abs(localY)) {
    return oppositeCurtainEdge(localX > 0 ? 'right' : 'left');
  }
  return oppositeCurtainEdge(localY > 0 ? 'bottom' : 'top');
}

function transitionCurtainEdge(first: SpiralTile, second: SpiralTile): CurtainEdge {
  return first.index < second.index
    ? curtainEdgeFor(first, second)
    : curtainEdgeFor(second, first);
}

function initialTheme(): 'light' | 'dark' {
  const storedTheme = localStorage.getItem('laterware-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export default function App() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const {
    activeIndex,
    settledIndex,
    lastTransitionFrom,
    layoutFocusIndex,
    pendingIndex,
    isTransitioning,
    isFocusTransitioning,
    contentIndices,
    navigate,
    tiles,
    viewportSize,
  } = useSpiralNavigation({
    pages,
    viewportRef,
    sceneRef,
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('laterware-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (viewportSize.width === 0 || viewportSize.height === 0) return undefined;

    let isCancelled = false;
    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    void fontsReady.then(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    })).then(() => {
      if (!isCancelled) {
        const loader = document.getElementById('startup-loader');
        loader?.classList.add('is-ready');
        loader?.setAttribute('aria-hidden', 'true');
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [viewportSize.width, viewportSize.height]);

  function toggleTheme() {
    setTheme((current) => current === 'light' ? 'dark' : 'light');
  }

  const activePose = viewportSize.width > 0 && viewportSize.height > 0
    ? getCameraPose(tiles, activeIndex, viewportSize.width, viewportSize.height)
    : null;

  return (
    <main className="app-shell">
      <div className="scene-viewport" ref={viewportRef} aria-label={PageText.SiteAriaLabel}>
        <div className="scene" ref={sceneRef}>
          {pages.map((page, index) => {
            const tile = tiles[index];
            const isContentVisible = contentIndices.includes(index);
            const isFocused = !isTransitioning
              && !isFocusTransitioning
              && activeIndex === index
              && activePose !== null;
            const isLayoutFocused = layoutFocusIndex === index;
            const previousTile = tiles[index - 1] ?? tiles[index + 1];
            const outgoingIndex = isTransitioning
              ? lastTransitionFrom ?? settledIndex
              : settledIndex;
            const incomingSourceIndex = pendingIndex === null
              ? lastTransitionFrom ?? (settledIndex > 0 ? settledIndex - 1 : settledIndex + 1)
              : settledIndex;
            const sourceTile = tiles[incomingSourceIndex];
            const targetTile = pendingIndex === null ? null : tiles[pendingIndex];
            const curtainEdge = index === pendingIndex && sourceTile
              ? transitionCurtainEdge(sourceTile, tile)
              : index === outgoingIndex && targetTile
                ? transitionCurtainEdge(tile, targetTile)
                : index === settledIndex && sourceTile
                  ? transitionCurtainEdge(sourceTile, tile)
                : previousTile
                  ? curtainEdgeFor(tile, previousTile)
                  : 'left';
            const curtainState = index === pendingIndex
              ? 'closed'
              : index === outgoingIndex && pendingIndex !== null
                ? 'closing'
                : index === settledIndex && isFocused && lastTransitionFrom !== null
                  ? 'opening'
                  : index === settledIndex && isFocused
                    ? 'open'
                    : 'closed';
            const focusWidth = isFocused ? viewportSize.width / activePose.scale : tile.side;
            const focusHeight = isFocused ? viewportSize.height / activePose.scale : tile.side;
            const staysAboveSpiral = isFocusTransitioning
              && !isTransitioning
              && activeIndex === index;
            const focusTextScale = isLayoutFocused && viewportSize.height > 0
              ? Math.max(1, Math.min(1.2, Math.sqrt(viewportSize.width / viewportSize.height)))
              : 1;
            const tileStyle: CSSProperties & { '--tile-side': string } = {
              left: isFocused ? activePose.x - focusWidth / 2 : tile.x,
              top: isFocused ? activePose.y - focusHeight / 2 : tile.y,
              width: focusWidth,
              height: focusHeight,
              fontSize: `${tile.side / 256 * focusTextScale}rem`,
              transform: `rotate(${tile.rotationTravelDegrees}deg)`,
              zIndex: isFocused || staysAboveSpiral ? pages.length + 1 : index,
              '--tile-side': `${tile.side}px`,
            };
            return (
              <div
                className="page-frame"
                key={page.id}
                style={tileStyle}
                data-page-index={index}
                data-active={activeIndex === index}
                data-focus={isLayoutFocused}
                data-settled-focus={isFocused}
                data-transitioning={isTransitioning}
                data-rendered={isContentVisible}
                aria-hidden={!isContentVisible}
                onClick={(event) => {
                  if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, label')) return;
                  if (event.currentTarget.dataset.settledFocus === 'true') return;
                  navigate(index);
                }}
              >
                {isContentVisible ? (
                  <PageContent
                    page={page}
                    index={index}
                    onNavigate={navigate}
                  />
                ) : (
                  <div className="page-preview" aria-hidden="true" />
                )}
                <div
                  className="page-curtain"
                  data-curtain-edge={curtainEdge}
                  data-curtain-state={curtainState}
                  aria-hidden="true"
                />
              </div>
            );
          })}
        </div>
      </div>

      <PageNavigation
        pages={pages}
        activeIndex={isTransitioning ? settledIndex : activeIndex}
        pendingIndex={pendingIndex}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </main>
  );
}
