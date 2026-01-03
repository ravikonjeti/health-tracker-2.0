import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { HealthDataProvider } from "./contexts/HealthDataContext";

createRoot(document.getElementById("root")!).render(
  <HealthDataProvider>
    <App />
  </HealthDataProvider>
);
