import { useEffect, useState } from "react";
import { DEFAULT_LOGO, DEFAULT_LOGO_SM, SHOP_LOGO_EVENT } from "@/lib/admin-nav";

type MarkVariant = "stamp" | "hero" | "login" | "mast" | "settings";

const SMALL = new Set<MarkVariant>(["stamp", "mast"]);

export function BrandMark({
  variant = "stamp",
  className = "",
}: {
  variant?: MarkVariant;
  className?: string;
}) {
  const compact = SMALL.has(variant);
  const fallback = compact ? DEFAULT_LOGO_SM : DEFAULT_LOGO;
  const [src, setSrc] = useState(fallback);

  useEffect(() => {
    const sync = () => {
      const custom = document.documentElement.dataset.shopLogo || "";
      setSrc(custom || fallback);
    };
    sync();
    window.addEventListener(SHOP_LOGO_EVENT, sync);
    return () => window.removeEventListener(SHOP_LOGO_EVENT, sync);
  }, [fallback]);

  const layout = variant === "stamp" ? 40 : compact ? 96 : 800;
  const stampStyle =
    variant === "stamp"
      ? ({
          width: 40,
          height: 40,
          maxWidth: 40,
          maxHeight: 40,
          flexShrink: 0,
          overflow: "hidden",
        } as const)
      : undefined;

  return (
    <span className={`brand-mark brand-mark-${variant} ${className}`.trim()} style={stampStyle}>
      <img
        src={src}
        alt="South End Pizza III — a chicken riding a buffalo"
        width={layout}
        height={layout}
        decoding="async"
        fetchPriority={variant === "hero" || variant === "stamp" ? "high" : "low"}
        style={
          variant === "stamp"
            ? { width: "100%", height: "100%", maxWidth: "none", maxHeight: "none", objectFit: "cover" }
            : undefined
        }
      />
    </span>
  );
}
