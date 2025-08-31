// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";

import Router from "./router.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ScrollToTop from "./ScrollToTop.jsx"; // 👈 add this tiny helper
import "./index.css";
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />  {/* ensures each route change starts at the top */}
        <Router />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
