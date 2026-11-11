import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./app/providers";
import { router } from "./app/routes";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/400-italic.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/archive.css";
import "./styles/explorer.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>,
);
