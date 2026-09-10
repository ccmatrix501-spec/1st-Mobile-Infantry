import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/store")({
  component: StoreLayout,
});

function StoreLayout() {
  return <Outlet />;
}
