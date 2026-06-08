import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../../../examples/_shared/lms-ui.css";
import "./demo.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
