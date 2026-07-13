import { Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { HomePage } from "./pages/HomePage";
import { PlayerPage } from "./pages/PlayerPage";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ComparePage } from "./pages/ComparePage";
import { NotFoundPage } from "./pages/NotFoundPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:tag" element={<PlayerPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/compare/:tagA/:tagB" element={<ComparePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
