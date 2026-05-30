import { useMemo } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayerProfile } from "../api/queries";
import { validateTag } from "../utils/tag";
import {
  PlayerHeader,
  PlayerHeaderSkeleton,
} from "../components/player/PlayerHeader";
import { TabNav, type Tab } from "../components/player/TabNav";
import { ErrorState } from "../components/ui/ErrorState";
import { OverviewTab } from "../components/tabs/OverviewTab";
import { BrawlersTab } from "../components/tabs/BrawlersTab";
import { BattlesTab } from "../components/tabs/BattlesTab";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "brawlers", label: "Brawlers" },
  { id: "battles", label: "Battles" },
  { id: "analytics", label: "Analytics", hint: "+" },
];

export function PlayerPage() {
  const { tag: raw } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const validation = useMemo(() => validateTag(raw ?? ""), [raw]);
  const tag = validation.ok ? validation.normalized : undefined;

  const activeTab = TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview";
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === "overview") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const profile = usePlayerProfile(tag);

  if (!validation.ok) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-12">
        <ErrorState
          title="Tag invalide"
          error={new Error(validation.reason ?? "Vérifie ton tag.")}
          onRetry={() => navigate("/")}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8 space-y-5">
      {profile.isLoading || !profile.data ? (
        profile.isError ? (
          <ErrorState
            error={profile.error}
            onRetry={() => void profile.refetch()}
          />
        ) : (
          <PlayerHeaderSkeleton />
        )
      ) : (
        <PlayerHeader player={profile.data.player} />
      )}

      {profile.data && (
        <>
          <TabNav tabs={TABS} active={activeTab} onChange={setTab} />
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === "overview" && tag && (
                <OverviewTab profile={profile.data} tag={tag} />
              )}
              {activeTab === "brawlers" && (
                <BrawlersTab player={profile.data.player} />
              )}
              {activeTab === "battles" && tag && <BattlesTab tag={tag} />}
              {activeTab === "analytics" && tag && (
                <AnalyticsTab profile={profile.data} tag={tag} />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </section>
  );
}
