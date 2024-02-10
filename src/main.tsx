import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { DevTools } from "jotai-devtools";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ChakraProvider>
    <DevTools />
    <App />
  </ChakraProvider>

  // </React.StrictMode>,
);
