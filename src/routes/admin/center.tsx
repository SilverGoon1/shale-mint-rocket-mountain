import { createFileRoute } from "@tanstack/react-router";
import { CustomerCenter, type CenterTab } from "@/components/customer-center";

const TABS = new Set<CenterTab>(["messages", "customers", "rewards"]);

export type CenterSearch = {
  tab?: CenterTab;
  thread?: string;
  customer?: string;
};

export const Route = createFileRoute("/admin/center")({
  validateSearch: (search: Record<string, unknown>): CenterSearch => {
    const tab = typeof search.tab === "string" && TABS.has(search.tab as CenterTab) ? (search.tab as CenterTab) : undefined;
    const thread = typeof search.thread === "string" && search.thread.trim() ? search.thread.trim() : undefined;
    const customer = typeof search.customer === "string" && search.customer.trim() ? search.customer.trim() : undefined;
    return {
      ...(tab ? { tab } : {}),
      ...(thread ? { thread } : {}),
      ...(customer ? { customer } : {}),
    };
  },
  component: AdminCenter,
});

function AdminCenter() {
  const { tab, thread, customer } = Route.useSearch();
  return <CustomerCenter tab={tab ?? "messages"} thread={thread} customer={customer} />;
}
