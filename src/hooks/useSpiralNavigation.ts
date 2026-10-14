import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  cameraTransform,
  getCameraProgress,
  getCameraPose,
  getCameraTransitionDuration,
} from '../lib/cameraMath';
import {
  buildStableFibonacciLayout,
  type SpiralAxis,
} from '../lib/fibonacciLayout';
import type { PageDefinition } from '../models/PageDefinition';
import { indexForSlug } from '../models/PageConstants';

interface NavigationOptions {
  pages: PageDefinition[];
  viewportRef: RefObject<HTMLDivElement | null>;
  sceneRef: RefObject<HTMLDivElement | null>;
}

const focusTransitionDuration = 500;
const curtainCloseDuration = 500;

export function useSpiralNavigation({ pages, viewportRef, sceneRef }: NavigationOptions) {
  const [axis, setAxis] = useState<SpiralAxis>(() =>
    window.innerWidth > window.innerHeight ? 'horizontal' : 'vertical',
  );
  const tiles = useMemo(() => buildStableFibonacciLayout(pages.length, 256, axis), [axis, pages.length]);
  const progress = useRef(0);
  const destination = useRef(0);
  const startAnimationRef = useRef<() => void>(() => {});
  const [activeIndex, setActiveIndex] = useState(0);
  const [settledIndex, setSettledIndex] = useState(0);
  const [lastTransitionFrom, setLastTransitionFrom] = useState<number | null>(null);
  const [layoutFocusIndex, setLayoutFocusIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFocusTransitioning, setIsFocusTransitioning] = useState(false);
  const [contentIndices, setContentIndices] = useState<number[]>([]);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const setVisibleContent = (
    value: number,
    transitioning: boolean,
  ) => {
    const activeIndex = Math.round(value);
    const visible = !transitioning && activeIndex >= 0 && activeIndex < pages.length
      ? [activeIndex]
      : [];
    setContentIndices((current) => (
      current.length === visible.length && current.every((index, position) => index === visible[position])
        ? current
        : visible
    ));
  };

  const navigate = useCallback((index: number) => {
    if (pages.length === 0) return;
    const target = Math.max(0, Math.min(pages.length - 1, index));
    destination.current = target;
    setPendingIndex(target);
    startAnimationRef.current();
  }, [pages.length]);

  useEffect(() => {
    const initialSlug = window.location.hash.replace(/^#\/?/, '');
    const initialIndex = indexForSlug(initialSlug);
    const initial = initialIndex >= 0 && initialIndex < pages.length ? initialIndex : 0;
    progress.current = initial;
    destination.current = initial;
    setActiveIndex(initial);
    setSettledIndex(initial);
    setLastTransitionFrom(null);
    setLayoutFocusIndex(initial);
    setPendingIndex(null);
    setContentIndices([initial]);
  }, [pages.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const scene = sceneRef.current;
    if (!viewport || !scene || pages.length === 0) return undefined;

    let frame = 0;
    let focusTimer = 0;
    let curtainClosePending = false;
    let focusCollapsePending = false;
    let animationStartTime: number | null = null;
    let animationFrom = progress.current;
    let animationTo = destination.current;
    let animationRunning = false;
    let touchStart: {
      x: number;
      y: number;
      scrollPositions: Array<{ element: HTMLElement; top: number }>;
    } | null = null;
    let wheelDirection = 0;
    let wheelDistance = 0;
    let wheelTriggered = false;
    let lastWheelTime = 0;
    let lastHash = window.location.hash.replace(/^#\/?/, '');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });

    const scrollableContentsFor = (target: EventTarget | null): HTMLElement[] => {
      if (!(target instanceof Element)) return [];
      const frame = target.closest('.page-frame[data-focus="true"]');
      if (!frame) return [];

      const scrollable: HTMLElement[] = [];
      let element = target instanceof HTMLElement ? target : target.parentElement;
      while (element && element !== frame) {
        const { overflowY } = getComputedStyle(element);
        if ((overflowY === 'auto' || overflowY === 'scroll')
          && element.scrollHeight > element.clientHeight + 1) {
          scrollable.push(element);
        }
        element = element.parentElement;
      }
      return scrollable;
    };

    const canScrollInDirection = (element: HTMLElement, direction: number) => {
      const maxScrollTop = element.scrollHeight - element.clientHeight;
      return direction > 0
        ? element.scrollTop < maxScrollTop - 1
        : element.scrollTop > 1;
    };

    const paint = (time: number) => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      animationStartTime ??= time;
      const elapsed = time - animationStartTime;
      const duration = reducedMotion.matches
        ? 0
        : getCameraTransitionDuration(animationFrom, animationTo);
      const settled = duration === 0 || elapsed >= duration;
      progress.current = settled
        ? animationTo
        : getCameraProgress(animationFrom, animationTo, elapsed);
      if (settled) {
        progress.current = animationTo;
        animationRunning = false;
      }

      const value = Math.max(0, Math.min(pages.length - 1, progress.current));
      const active = Math.round(value);
      setActiveIndex((current) => current === active ? current : active);
      if (settled) {
        setLayoutFocusIndex(Math.round(animationTo));
      } else if (Math.abs(animationTo - value) <= 0.12) {
        setLayoutFocusIndex((current) => current === animationTo ? current : animationTo);
      }
      setVisibleContent(value, !settled);
      const pose = getCameraPose(tiles, value, width, height);
      scene.style.setProperty('--spiral-border-width', `${1 / pose.scale}px`);
      const captionScreenSize = Math.min(28, Math.max(12, Math.min(width, height) * 0.035));
      scene.style.setProperty('--page-caption-font-size', `${captionScreenSize / pose.scale}px`);
      scene.style.transform = cameraTransform(pose, width, height);

      if (settled) {
        scene.style.willChange = 'auto';
        setIsTransitioning(false);
        setIsFocusTransitioning(false);
        setSettledIndex(Math.round(animationTo));
        setPendingIndex(null);
        setVisibleContent(value, false);
        const slug = pages[Math.round(animationTo)]?.slug;
        if (slug && slug !== lastHash) {
          lastHash = slug;
          window.history.pushState(null, '', `#${slug}`);
        }
        frame = 0;
        return;
      }
      frame = window.requestAnimationFrame(paint);
    };

    const beginAnimation = () => {
      animationFrom = progress.current;
      animationTo = destination.current;
      if (Math.abs(animationTo - animationFrom) >= 0.0001) {
        setLastTransitionFrom(Math.round(animationFrom));
      }
      setLayoutFocusIndex(Math.round(animationFrom));
      animationStartTime = null;
      if (Math.abs(animationTo - animationFrom) < 0.0001) {
        animationRunning = false;
        setIsTransitioning(false);
        setIsFocusTransitioning(false);
        focusCollapsePending = false;
        if (frame) {
          window.cancelAnimationFrame(frame);
          frame = 0;
        }
        const value = Math.max(0, Math.min(pages.length - 1, animationTo));
        const pose = getCameraPose(
          tiles,
          value,
          viewport.clientWidth,
          viewport.clientHeight,
        );
        scene.style.setProperty('--spiral-border-width', `${1 / pose.scale}px`);
        const captionScreenSize = Math.min(
          28,
          Math.max(12, Math.min(viewport.clientWidth, viewport.clientHeight) * 0.035),
        );
        scene.style.setProperty('--page-caption-font-size', `${captionScreenSize / pose.scale}px`);
        scene.style.transform = cameraTransform(
          pose,
          viewport.clientWidth,
          viewport.clientHeight,
        );
        scene.style.willChange = 'auto';
        setActiveIndex(Math.round(value));
        setSettledIndex(Math.round(value));
        setLayoutFocusIndex(Math.round(value));
        setPendingIndex(null);
        setVisibleContent(value, false);
        return;
      }
      setIsTransitioning(true);
      animationRunning = true;
      scene.style.willChange = 'transform';
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    const startAnimation = () => {
      setPendingIndex(destination.current);
      if (Math.abs(destination.current - progress.current) < 0.0001) {
        if (focusTimer) {
          window.clearTimeout(focusTimer);
          focusTimer = 0;
          curtainClosePending = false;
          focusCollapsePending = false;
          setIsFocusTransitioning(false);
        }
        beginAnimation();
        return;
      }

      if (animationRunning || curtainClosePending || focusCollapsePending) {
        if (animationRunning) beginAnimation();
        return;
      }

      curtainClosePending = true;
      focusTimer = window.setTimeout(() => {
        focusTimer = 0;
        curtainClosePending = false;
        focusCollapsePending = true;
        setIsFocusTransitioning(true);
        focusTimer = window.setTimeout(() => {
          focusTimer = 0;
          focusCollapsePending = false;
          beginAnimation();
        }, reducedMotion.matches ? 0 : focusTransitionDuration);
      }, reducedMotion.matches ? 0 : curtainCloseDuration);
    };
    startAnimationRef.current = startAnimation;

    const onWheel = (event: WheelEvent) => {
      if (document.querySelector('dialog[open]')) {
        wheelDistance = 0;
        wheelTriggered = false;
        wheelDirection = 0;
        return;
      }

      const now = performance.now();
      if (now - lastWheelTime > 240) {
        wheelDistance = 0;
        wheelTriggered = false;
        wheelDirection = 0;
      }
      lastWheelTime = now;

      if (animationRunning) {
        event.preventDefault();
        return;
      }
      if (event.deltaY === 0) return;

      const direction = Math.sign(event.deltaY);
      const canScroll = scrollableContentsFor(event.target)
        .some((content) => canScrollInDirection(content, direction));
      if (canScroll) {
        wheelDistance = 0;
        wheelTriggered = false;
        wheelDirection = 0;
        return;
      }

      event.preventDefault();
      if (wheelDirection !== direction) {
        wheelDistance = 0;
        wheelTriggered = false;
        wheelDirection = direction;
      }
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? viewport.clientHeight
          : 1;
      wheelDistance += Math.abs(event.deltaY) * unit;
      if (wheelDistance < 32 || wheelTriggered) return;

      wheelTriggered = true;
      destination.current = Math.max(
        0,
        Math.min(pages.length - 1, Math.round(progress.current) + direction),
      );
      startAnimation();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest('dialog[open]')) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target instanceof HTMLElement && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
      const forward = ['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key);
      const backward = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key);
      if (!forward && !backward) return;

      const scrollDirection = ['ArrowDown', 'PageDown'].includes(event.key)
        ? 1
        : ['ArrowUp', 'PageUp'].includes(event.key)
          ? -1
          : 0;
      if (scrollDirection) {
        const scrollable = scrollableContentsFor(event.target)
          .find((content) => canScrollInDirection(content, scrollDirection));
        if (scrollable) {
          event.preventDefault();
          scrollable.scrollBy({
            top: scrollDirection * (event.key.startsWith('Page') ? scrollable.clientHeight * .85 : 40),
            behavior: reducedMotion.matches ? 'auto' : 'smooth',
          });
          return;
        }
      }

      event.preventDefault();
      destination.current = Math.max(0, Math.min(pages.length - 1, Math.round(destination.current) + (forward ? 1 : -1)));
      startAnimation();
    };

    const onTouchStart = (event: TouchEvent) => {
      if (document.querySelector('dialog[open]')) {
        touchStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const scrollPositions = scrollableContentsFor(event.target)
        .map((element) => ({ element, top: element.scrollTop }));
      touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        scrollPositions,
      };
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (document.querySelector('dialog[open]')) {
        touchStart = null;
        return;
      }
      if (!touchStart) return;
      const touch = event.changedTouches[0];
      const deltaY = touchStart.y - touch.clientY;
      const deltaX = touchStart.x - touch.clientX;
      const { scrollPositions } = touchStart;
      touchStart = null;
      if (animationRunning) return;
      if (Math.abs(deltaY) < 48 || Math.abs(deltaY) < Math.abs(deltaX) * 1.1) return;
      if (scrollPositions.some(({ element, top }) => Math.abs(element.scrollTop - top) > 1)) return;
      const canScroll = scrollPositions
        .some(({ element }) => canScrollInDirection(element, deltaY > 0 ? 1 : -1));
      if (canScroll) return;
      destination.current = Math.max(0, Math.min(pages.length - 1, Math.round(progress.current) + (deltaY > 0 ? 1 : -1)));
      startAnimation();
    };

    const onHistory = () => {
      const slug = window.location.hash.replace(/^#\/?/, '');
      const index = indexForSlug(slug);
      if (index >= 0) {
        destination.current = index;
        startAnimation();
      }
    };

    const onResize = () => {
      setViewportSize({ width: viewport.clientWidth, height: viewport.clientHeight });
      const nextAxis: SpiralAxis = viewport.clientWidth > viewport.clientHeight
        ? 'horizontal'
        : 'vertical';
      setAxis((current) => current === nextAxis ? current : nextAxis);
      startAnimation();
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('hashchange', onHistory);
    window.addEventListener('popstate', onHistory);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(viewport);
    startAnimation();

    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('hashchange', onHistory);
      window.removeEventListener('popstate', onHistory);
      resizeObserver.disconnect();
      startAnimationRef.current = () => {};
      if (focusTimer) window.clearTimeout(focusTimer);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [axis, pages, sceneRef, tiles, viewportRef]);

  return {
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
    axis,
    viewportSize,
  };
}
