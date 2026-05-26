/**
 * useMagicArea – GSAP-powered sliding highlight for hover/focus.
 *
 * Returns { containerRef, magicRef } — render both refs in your JSX:
 *
 *   const { containerRef, magicRef } = useMagicArea();
 *
 *   <div ref={containerRef} className="relative flex gap-1">
 *     <div ref={magicRef} className="c-magic-area c-magic-area--menu" aria-hidden="true" />
 *     <a className="magic-item">Link A</a>
 *     <a className="magic-item">Link B</a>
 *   </div>
 *
 * Scope is always limited to containerRef — multiple instances never clash.
 */

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export type MagicVariant = "menu" | "content";

interface Options {
  /** CSS class identifying trackable items inside the container. Default: "magic-item" */
  itemClass?: string;
  /**
   * If true, on mouse-leave the highlight snaps back to the active item
   * (.active or aria-current="page"). If false, stays on last hovered item.
   */
  tweenBack?: boolean;
}

export function useMagicArea({
  itemClass = "magic-item",
  tweenBack = true,
}: Options = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const magicRef = useRef<HTMLDivElement>(null);

  const getActive = useCallback(
    (items: HTMLElement[]): HTMLElement | null =>
      items.find(
        (el) =>
          el.classList.contains("active") ||
          el.getAttribute("aria-current") === "page"
      ) ??
      items[0] ??
      null,
    []
  );

  const moveTo = useCallback(
    (target: HTMLElement, immediate = false) => {
      const magic = magicRef.current;
      const container = containerRef.current;
      if (!magic || !container) return;

      const cr = container.getBoundingClientRect();
      const tr = target.getBoundingClientRect();

      // Make visible before animating
      magic.classList.add("c-magic-area--active");

      gsap.to(magic, {
        duration: immediate ? 0 : 0.35,
        left: tr.left - cr.left,
        top: tr.top - cr.top,
        width: tr.width,
        height: tr.height,
        ease: "power3.out",
        overwrite: true,
      });
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Defer so the browser has painted and getBoundingClientRect() is valid
    const timer = setTimeout(() => {
      const items = Array.from(
        container.querySelectorAll<HTMLElement>(`.${itemClass}`)
      );
      if (!items.length) return;

      // Snap to active item immediately (no animation)
      const active = getActive(items);
      if (active) moveTo(active, true);

      const onEnter = (e: Event) => moveTo(e.currentTarget as HTMLElement);
      const onLeave = () => {
        if (!tweenBack) return;
        const a = getActive(items);
        if (a) moveTo(a);
      };

      items.forEach((item) => {
        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("focus", onEnter);
        item.addEventListener("mouseleave", onLeave);
        item.addEventListener("blur", onLeave);
      });

      // Cleanup inside the timeout callback
      return () => {
        items.forEach((item) => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("focus", onEnter);
          item.removeEventListener("mouseleave", onLeave);
          item.removeEventListener("blur", onLeave);
        });
      };
    }, 80);

    return () => clearTimeout(timer);
  }, [itemClass, tweenBack, getActive, moveTo]);

  return { containerRef, magicRef };
}
