import { QueryClientProvider } from "@tanstack/react-query";

import { HeroUIProvider } from "@heroui/system";
import { Toaster } from "sonner";
import { queryClient } from "~shared/lib/react-query/react-query.lib";
import { BrowserRouter } from "./router";

function App() {
  return (
    <HeroUIProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter />
        <Toaster />
      </QueryClientProvider>
    </HeroUIProvider>
  );
}

export default App;
