import Image from "next/image";

type MarkVariant = "blue" | "white";
type LogoVariant = "mark" | "horizontal";

interface BrandLogoProps {
  variant?: LogoVariant;
  mark?: MarkVariant;
  /** Altura aproximada em px */
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Logos oficiais UNIFOR.
 * - mark blue: fundos claros (header da landing, app)
 * - mark/logo white: fundos navy (hero, footer, auth)
 */
export function BrandLogo({
  variant = "mark",
  mark = "blue",
  height = 36,
  className = "",
  priority = false,
}: BrandLogoProps) {
  if (variant === "horizontal") {
    const width = Math.round(height * (300 / 127));
    return (
      <Image
        src="/brand/unifor-logo-white.png"
        alt="UNIFOR"
        width={width}
        height={height}
        className={`object-contain ${className}`}
        priority={priority}
        style={{ height, width: "auto" }}
      />
    );
  }

  const src =
    mark === "white"
      ? "/brand/unifor-mark-white.png"
      : "/brand/unifor-mark-blue.png";
  const aspect = mark === "white" ? 1 : 137 / 150;
  const width = Math.round(height * aspect);

  return (
    <Image
      src={src}
      alt="Símbolo UNIFOR"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}

export function DesapegaWordmark({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const color = tone === "light" ? "text-white" : "text-navy";
  return (
    <span
      className={`font-[family-name:var(--font-display)] font-bold tracking-tight ${color} ${className}`}
    >
      Desapega{" "}
      <span className={tone === "light" ? "text-white/80" : "text-brand"}>
        UNIFOR
      </span>
    </span>
  );
}

/** Subtítulo sob a wordmark no header. */
export const BRAND_TAGLINE = "Projeto Vortex";

export function BrandTagline({
  className = "",
}: {
  className?: string;
}) {
  return (
    <p className={`font-medium leading-tight text-muted ${className}`}>
      {BRAND_TAGLINE}
    </p>
  );
}
