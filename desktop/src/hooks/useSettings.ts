import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { LayoutMode } from "../types";

export function useSettings() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    return (localStorage.getItem("layoutMode") as LayoutMode) || "classic";
  });

  const [clickThrough, setClickThrough] = useState<boolean>(() => {
    return localStorage.getItem("clickThrough") === "true";
  });

  useEffect(() => {
    // Listen for layout changes
    const unlistenLayout = listen<LayoutMode>("layout-mode-changed", (event) => {
      setLayoutMode(event.payload);
      localStorage.setItem("layoutMode", event.payload);
    });

    // Listen for click-through changes
    const unlistenClick = listen<boolean>("click-through-changed", (event) => {
      setClickThrough(event.payload);
      localStorage.setItem("clickThrough", event.payload.toString());
    });

    return () => {
      unlistenLayout.then(fn => fn());
      unlistenClick.then(fn => fn());
    };
  }, []);

  const changeLayoutMode = (mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem("layoutMode", mode);
    emit("layout-mode-changed", mode);
  };

  const changeClickThrough = (enabled: boolean) => {
    setClickThrough(enabled);
    localStorage.setItem("clickThrough", enabled.toString());
    emit("click-through-changed", enabled);
    // Call the native command to apply the window state immediately
    invoke("set_overlay_click_through", { enabled }).catch(console.error);
  };

  return { layoutMode, changeLayoutMode, clickThrough, changeClickThrough };
}
