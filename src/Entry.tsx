import React from "react"

import ReactDOM from "react-dom/client"

import { SideMenu } from "@components/SideMenu"

import { applySky } from "@sky"

import { routeFor } from "@utils/routeFor"

import "@styles/global.css"
import "@styles/keyframes.css"
import "@styles/tokens.css"

import { pageForRoute } from "@app/pageForRoute"

const rootEl = document.getElementById("root")

if (rootEl) {
  const route = routeFor(window.location.pathname)
  if (route === "app") applySky()

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <SideMenu />
      {pageForRoute(route)}
    </React.StrictMode>
  )
}
