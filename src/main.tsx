import "@/index.css";
import { enableMapSet } from "immer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
enableMapSet();
// Import Supabase test for debugging
import "./lib/supabase-test";
// Do not touch this code
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
