console.log('[Blink] App.tsx evaluating');
import { Routes } from "./routes";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Routes />
      <Toaster position="top-right" richColors />
    </>
  );
}

export default App;