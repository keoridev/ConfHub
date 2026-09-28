import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~shared/lib/react-query/react-query.lib";
import { BrowserRouter } from "./router";
import { Toaster } from "sonner";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
