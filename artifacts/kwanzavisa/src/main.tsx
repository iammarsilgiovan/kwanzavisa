import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
if (apiBaseUrl) {
  setBaseUrl(apiBaseUrl);
}

// Configurar o token de autenticação administrativa para o cliente de API
setAuthTokenGetter(() => {
  const isAdmin = localStorage.getItem("kv_admin_auth") === "true";
  return isAdmin ? "kwanza2025admin" : null;
});

createRoot(document.getElementById("root")!).render(<App />);

