// Global error handler — catches module-evaluation crashes that prevent React from mounting

import { createRoot } from "react-dom/client";

import "./index.css";

import { isComingSoonMode } from "./config/coming-soon";



if (isComingSoonMode()) {

  void import("./i18n").then(() =>

    import("./screens/marketing/ComingSoonScreen").then(({ default: ComingSoonScreen }) => {

      createRoot(document.getElementById("root")!).render(<ComingSoonScreen />);

    }),

  );

} else {

  void import("./main-app-boot.tsx");

}


