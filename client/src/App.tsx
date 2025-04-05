import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import IntakeForm from "./pages/IntakeForm";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="p-4 max-w-4xl mx-auto">
        <IntakeForm />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
