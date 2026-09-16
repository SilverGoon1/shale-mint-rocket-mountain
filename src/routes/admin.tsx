import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { ShopHeader } from "@/components/shop-header";
import { AdminDrawer, AdminMenuProvider } from "@/components/admin-drawer";
import { IncomingOrderQueue } from "@/components/incoming-order-queue";
import { SessionGate } from "@/components/guards";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const posMode = pathname === "/admin/pos" || pathname.startsWith("/admin/pos/");

  return (
    <div className="shop-shell" data-pos={posMode || undefined}>
      <SessionGate needAdmin>
        {({ profile }) => (
          <AdminMenuProvider>
            <ShopHeader profile={profile} />
            <div className="admin-layout">
              <AdminDrawer />
              <main className="admin-main" id="main">
                <Outlet />
              </main>
            </div>
            <IncomingOrderQueue />
          </AdminMenuProvider>
        )}
      </SessionGate>
    </div>
  );
}
