import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// TODO: Import BrowserRouter from react-router-dom
// TODO: Import your AuthContextProvider

// TODO: Wrap App with BrowserRouter and AuthContextProvider
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
