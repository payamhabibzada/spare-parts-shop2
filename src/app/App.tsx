import { RouterProvider } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { router } from "./routes";
import { queryClient } from "./lib/react-query";
import { ShopUserProvider } from "./store/ShopUserContext";
import { AppProvider } from "./store/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ShopUserProvider>
          <AppProvider>
            <RouterProvider router={router} />
            <ReactQueryDevtools initialIsOpen={false} />
          </AppProvider>
        </ShopUserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
