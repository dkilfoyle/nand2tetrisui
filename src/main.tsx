import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { DevTools } from "jotai-devtools";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <div style={{ height: "100vh", width: "100vw", padding: "5px", background: "#ebeced" }}>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </div>

  // </React.StrictMode>,
);
