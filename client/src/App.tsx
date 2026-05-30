import { Route, Routes } from "react-router-dom";
import { TopBar } from "./components/TopBar";
import { HomePage } from "./pages/HomePage";
import { PlayerPage } from "./pages/PlayerPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/player/:tag" element={<PlayerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="mt-12 py-6 text-center text-text-dim text-xs">
        Brawl Analytics · données via Brawl Stars API · projet non affilié à Supercell
      </footer>
    </div>
  );
}
