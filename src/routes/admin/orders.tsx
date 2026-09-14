import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/orders")({
  component: () => <Navigate to="/admin/pos" />,
});
