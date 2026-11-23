import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import { definirRoteador } from "./lib/navegar.js";
import { roteador } from "./rotas.jsx";

definirRoteador(roteador);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={roteador} />
  </StrictMode>
);
