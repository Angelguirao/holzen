import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { listenForSwUpdate } from "./lib/sw-update";

createRoot(document.getElementById("root")!).render(<App />);

// Auto-reload when a new service worker version activates
listenForSwUpdate();
