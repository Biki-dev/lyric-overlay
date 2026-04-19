import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { LayoutMode } from "../types";

export function useSettings() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    return (localStorage.getItem("layoutMode") as LayoutMode) || "classic";
  });

  useEffect(() => {
    // Listen for changes from other windows
    const unlisten = listen<LayoutMode>("layout-mode-changed", (event) => {
      setLayoutMode(event.payload);
      localStorage.setItem("layoutMode", event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  const changeLayoutMode = (mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem("layoutMode", mode);
    // Broadcast to other windows
    emit("layout-mode-changed", mode);
  };

  return { layoutMode, changeLayoutMode };
}
