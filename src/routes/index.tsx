import { useEffect, useState } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ShopHeader } from "@/components/shop-header";
import { Storefront } from "@/components/storefront";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useCartStore } from "@/lib/cart-store";
import { getMe, getStorefront } from "@/lib/shop-server";
import { retryTransient } from "@/lib/fetch-retry";
import { needsSignupOtp } from "@/lib/phone";
import type { ProfileView } from "@/lib/shop-types";

export const Route = createFileRoute("/")({
  loader: () => retryTransient(() => getStorefront()),
  staleTime: 30_000,
  pendingMs: 8_000,
  pendingComponent: HomePending,
  component: Home,
});

function HomePending() {
  return (
    <div className="shop-shell">
      <ShopHeader />
      <main className="shop-main" id="main">
        <div className="store-layout" aria-busy="true" aria-label="Loading the menu">
          <div className="store-main">
            <div className="hero-skel" />
            <div className="cat-rail">
              {Array.from({ length: 8 }, (_, i) => (
                <span key={i} className="skel-chip" />
              ))}
            </div>
            <div className="food-grid">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skel-card" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Home() {
  const data = Route.useLoaderData();
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const toggleBag = useCartStore((s) => s.toggleBag);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      setProfile(null);
      return;
    }
    void retryTransient(() => getMe())
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [isPending, user]);

  useEffect(() => {
    try {
      sessionStorage.removeItem("southend-fetch-retry-n");
    } catch {
      /* ignore */
    }
  }, []);
  if (profile && needsSignupOtp(profile.email) && !profile.emailVerified) {
    return <Navigate to="/login" search={{ next: "/" }} replace />;
  }
  return (
    <div className="shop-shell">
      <ShopHeader profile={profile} onOpenCart={toggleBag} />
      <main className="shop-main" id="main">
        <Storefront
          restaurant={data.restaurant}
          categories={data.categories}
          settings={data.settings}
          profile={profile}
        />
      </main>
    </div>
  );
}
