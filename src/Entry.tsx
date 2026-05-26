import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import { applySky } from "@sky"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

applySky()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
