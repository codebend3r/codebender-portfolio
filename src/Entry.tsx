import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import { applySky } from "@sky"

import "@styles/tokens.css"
import "@styles/keyframes.css"
import "@styles/global.css"

applySky()

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
