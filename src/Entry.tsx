import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import { AuthGate } from "@components/AuthGate"

import EditResumeApp from "@edit/EditResumeApp"

import GenerateApp from "@generate/GenerateApp"

import { applySky } from "@sky"

import { routeFor } from "@utils/routeFor"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

const rootEl = document.getElementById("root")

if (rootEl) {
  const route = routeFor(window.location.pathname)
  if (route === "app") applySky()

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      {route === "edit" ? (
        <AuthGate>
          <EditResumeApp />
        </AuthGate>
      ) : route === "generate" ? (
        <AuthGate>
          <GenerateApp />
        </AuthGate>
      ) : (
        <App />
      )}
    </React.StrictMode>
  )
}
