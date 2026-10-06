import { QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/system";
import { Toaster } from "sonner";
import { queryClient } from "~shared/lib/react-query/react-query.lib";
import { AppRouter } from "./router";

function App() {
  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            className: "bg-primary text-primary-foreground border-none",
          }}
        />
      </QueryClientProvider>
    </HeroUIProvider>
  );
}

export default App;
