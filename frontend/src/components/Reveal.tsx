"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  variant?:
    | "fade-up"
    | "fade"
    | "slide-left"
    | "slide-right"
    | "slide-up"
    | "slide-down"
    | "scale"
    | "zoom-in";
  /**
   * Se true, anima só na primeira entrada.
   * Default false: reentra ao descer e volta ao subir.
   */
  once?: boolean;
};

/**
 * Reveal no scroll: entra ao aparecer e reverte ao sair da viewport.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  variant = "fade-up",
  once = false,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("is-revealed");
      return;
    }

    let hasRevealed = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("is-revealed");
          hasRevealed = true;
          if (once) observer.unobserve(el);
          return;
        }

        if (!once && hasRevealed) {
          el.style.transitionDelay = "0ms";
          el.classList.remove("is-revealed");
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, delay]);

  const style = {
    "--reveal-delay": `${delay}ms`,
  } as CSSProperties;

  const Comp = Tag as ElementType;

  return (
    <Comp
      ref={ref}
      className={`reveal reveal-${variant} ${className}`}
      style={style}
    >
      {children}
    </Comp>
  );
}
