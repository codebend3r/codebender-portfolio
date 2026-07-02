import React from "react"

import App from "@App"
import ReactDOM from "react-dom/client"

import EditResumeApp from "@edit/EditResumeApp"

import { applySky } from "@sky"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

export function routeFor(pathname: string): "edit" | "app" {
  return pathname === "/edit-resume" ? "edit" : "app"
}

const rootEl = document.getElementById("root")

if (rootEl) {
  const isEdit = routeFor(window.location.pathname) === "edit"
  if (!isEdit) applySky()

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>{isEdit ? <EditResumeApp /> : <App />}</React.StrictMode>
  )
}
