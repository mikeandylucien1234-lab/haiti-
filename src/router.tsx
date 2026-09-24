import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import RootLayout from "@/components/RootLayout";
import HomePage from "@/features/catalog/HomePage";
import BuilderPage from "@/features/builder/BuilderPage";
import CartPage from "@/features/cart/CartPage";
import DeliveryPage from "@/features/checkout/DeliveryPage";
import PaymentPage from "@/features/checkout/PaymentPage";
import ConfirmationPage from "@/features/checkout/ConfirmationPage";
import OrdersPage from "@/features/orders/OrdersPage";
import FavoritesPage from "@/features/catalog/FavoritesPage";
import { lazyRouteComponent } from "@tanstack/react-router";

// L'espace restaurant n'est jamais visité par un client : on l'exclut du bundle principal.
const AdminLoginPage = lazyRouteComponent(() => import("@/features/admin/AdminLoginPage"));
const AdminLayout = lazyRouteComponent(() => import("@/features/admin/AdminLayout"));
const AdminOrdersPage = lazyRouteComponent(() => import("@/features/admin/AdminOrdersPage"));
const AdminCatalogPage = lazyRouteComponent(() => import("@/features/admin/AdminCatalogPage"));
const AdminSettingsPage = lazyRouteComponent(() => import("@/features/admin/AdminSettingsPage"));

export const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const builderRoute = createRoute({ getParentRoute: () => rootRoute, path: "/composer", component: BuilderPage });
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: "/panier", component: CartPage });
const deliveryRoute = createRoute({ getParentRoute: () => rootRoute, path: "/livraison", component: DeliveryPage });
const paymentRoute = createRoute({ getParentRoute: () => rootRoute, path: "/paiement", component: PaymentPage });
const confirmationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/confirmation/$orderId",
  component: ConfirmationPage,
});
const ordersRoute = createRoute({ getParentRoute: () => rootRoute, path: "/mes-commandes", component: OrdersPage });
const favoritesRoute = createRoute({ getParentRoute: () => rootRoute, path: "/favoris", component: FavoritesPage });

const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: AdminLoginPage,
});
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayout,
});
const adminOrdersRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: AdminOrdersPage,
});
const adminCatalogRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/catalogue",
  component: AdminCatalogPage,
});
const adminSettingsRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/reglages",
  component: AdminSettingsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  builderRoute,
  cartRoute,
  deliveryRoute,
  paymentRoute,
  confirmationRoute,
  ordersRoute,
  favoritesRoute,
  adminLoginRoute,
  adminLayoutRoute.addChildren([adminOrdersRoute, adminCatalogRoute, adminSettingsRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
