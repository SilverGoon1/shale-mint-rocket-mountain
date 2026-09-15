import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { CartHydrate } from "@/components/cart-hydrate";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ShopBackdrop } from "@/components/shop-backdrop";
import { SeasonFx } from "@/components/season-fx";
import { SupportDock } from "@/components/support-dock";
import { OrderAlerts } from "@/components/order-alerts";
import { UpdateBanner } from "@/components/update-banner";
import appCss from "../styles.css?url";

const APP_NAME = "South End Pizza III";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Order from South End Pizza III in Egg Harbor Township, NJ. Pizza, subs, wings, and more — pickup or delivery.",
      },
      { name: "theme-color", content: "#fbf6ec" },
      { name: "application-name", content: "South End Pizza" },
      { name: "apple-mobile-web-app-title", content: "South End" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32.png" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "preload", href: "/mark.jpg", as: "image" },
      { rel: "preload", href: "/mark-sm.jpg", as: "image" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:wght@500;600;700&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="app-root">
          <ShopBackdrop />
          <SeasonFx />
          <AuthProvider>
            <CartHydrate />
            <Outlet />
            <SupportDock />
            <OrderAlerts />
            <UpdateBanner />
          </AuthProvider>
        </div>
        <Scripts />
      </body>
    </html>
  ),
});
