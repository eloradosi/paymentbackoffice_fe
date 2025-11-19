import { createRoot } from "react-dom/client";
import App from "./App";
// @ts-ignore: Cannot find module or type declarations for side-effect import of './index.css'
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
