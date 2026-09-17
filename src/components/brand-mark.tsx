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

  // Header stamp size is owned by CSS (.shop-header .brand-mark-stamp → 66×66).
  // Keep width/height attrs at 66 for intrinsic ratio; do not set conflicting inline box size.
  const layout = variant === "stamp" ? 66 : compact ? 96 : 800;

  return (
    <span className={`brand-mark brand-mark-${variant} ${className}`.trim()}>
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
