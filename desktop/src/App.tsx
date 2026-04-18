import { Routes, Route } from "react-router-dom";
import ControlPanel from "./pages/ControlPanel.tsx";
import Overlay from "./pages/Overlay.tsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ControlPanel />} />
      <Route path="/overlay" element={<Overlay />} />
    </Routes>
  );
}

export default App;