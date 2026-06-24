import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ShopLogin from "./pages/ShopLogin";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Debts from "./pages/Debts";
import CustomerProfile from "./pages/CustomerProfile";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Withdrawals from "./pages/Withdrawals";
import Shareholders from "./pages/Shareholders";
import ShareholderProfile from "./pages/ShareholderProfile";
import Suppliers from "./pages/Suppliers";
import SupplierProfile from "./pages/SupplierProfile";
import Users from "./pages/Users";

export const router = createBrowserRouter([
  {
    path: "/shop-login",
    Component: ShopLogin,
  },
  {
    path: "/admin-login",
    Component: AdminLogin,
  },
  {
    path: "/admin-panel",
    Component: AdminPanel,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Dashboard },
      { path: "products", Component: Products },
      { path: "categories", Component: Categories },
      { path: "customers", Component: Customers },
      { path: "sales", Component: Sales },
      { path: "debts", Component: Debts },
      { path: "customer-profile/:customerId", Component: CustomerProfile },
      { path: "payments", Component: Payments },
      { path: "expenses", Component: Expenses },
      { path: "withdrawals", Component: Withdrawals },
      { path: "shareholders", Component: Shareholders },
      { path: "shareholder-profile/:shareholderId", Component: ShareholderProfile },
      { path: "suppliers", Component: Suppliers },
      { path: "supplier-profile/:supplierId", Component: SupplierProfile },
      { path: "users", Component: Users },
    ],
  },
]);
