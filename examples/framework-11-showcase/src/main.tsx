import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../../_shared/lms-ui.css";
import "../../_shared/showcase/showcase-ui.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
