import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useActivateTracking, usePlayerProfile } from "../api/queries";
import { validateTag } from "../utils/tag";
import { recordVisit } from "../utils/profileHistory";
import {
  PlayerHeader,
  PlayerHeaderSkeleton,
} from "../components/player/PlayerHeader";
import { ProfileNav, PROFILE_TABS } from "../components/player/ProfileNav";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { OverviewTab } from "../components/tabs/OverviewTab";
import { BrawlersTab } from "../components/tabs/BrawlersTab";
import { BattlesTab } from "../components/tabs/BattlesTab";
import { AnalyticsTab } from "../components/tabs/AnalyticsTab";
import { ClubTab } from "../components/tabs/ClubTab";
import { GuideTab } from "../components/tabs/GuideTab";
import { BrawlerSheet } from "../components/player/BrawlerSheet";
import { ShareCard } from "../components/player/ShareCard";

export function PlayerPage() {
  const { tag: raw } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const validation = useMemo(() => validateTag(raw ?? ""), [raw]);
  const tag = validation.ok ? validation.normalized : undefined;

  const profile = usePlayerProfile(tag);
  const activateTracking = useActivateTracking();

  // Enregistre le tag pour la capture en arrière-plan dès qu'on ouvre un profil.
  useEffect(() => {
    if (tag) activateTracking.mutate(tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tag]);

  const activeTab =
    PROFILE_TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview";
  const setTab = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === "overview") next.delete("tab");
    else next.set("tab", id);
    setParams(next, { replace: true });
  };

  const [shareOpen, setShareOpen] = useState(false);

  // Brawler ouvert piloté par l'URL (?brawler=<id>) → la fiche est partageable par lien direct.
  const brawlerParam = params.get("brawler");
  const openBrawler = useMemo(() => {
    if (!brawlerParam || !profile.data) return null;
    return (
      profile.data.player.brawlers.find(
        (b) => String(b.id) === brawlerParam,
      ) ?? null
    );
  }, [brawlerParam, profile.data]);

  const setBrawlerParam = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id === null) next.delete("brawler");
    else next.set("brawler", String(id));
    setParams(next, { replace: true });
  };

  // Snapshot de la visite (pour la courbe de trophées + "depuis ta dernière visite").
  useEffect(() => {
    if (!tag || !profile.data) return;
    recordVisit(tag, {
      trophies: profile.data.player.trophies,
      brawlers: profile.data.summary.brawlers.owned,
      level: profile.data.player.expLevel,
    });
  }, [tag, profile.data]);

  const openBrawlerById = (id: number) => setBrawlerParam(id);

  if (!validation.ok) {
    return (
      <ErrorState
        title="Tag invalide"
        error={new Error(validation.reason ?? "Vérifie ton tag.")}
        onHome={() => navigate("/")}
      />
    );
  }

  if (profile.isError) {
    return (
      <ErrorState
        error={profile.error}
        onRetry={() => void profile.refetch()}
        onHome={() => navigate("/")}
      />
    );
  }

  if (profile.isLoading || !profile.data) {
    return (
      <div className="space-y-4">
        <PlayerHeaderSkeleton />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40" />
        <Skeleton className="h-52" />
      </div>
    );
  }

  const { data } = profile;

  return (
    <div className="space-y-4">
      <PlayerHeader
        player={data.player}
        tag={tag!}
        onShare={() => setShareOpen(true)}
      />

      <ProfileNav active={activeTab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === "overview" && (
            <OverviewTab
              profile={data}
              tag={tag!}
              onOpenBrawler={openBrawlerById}
            />
          )}
          {activeTab === "brawlers" && (
            <BrawlersTab
              player={data.player}
              onOpenBrawler={openBrawlerById}
            />
          )}
          {activeTab === "battles" && <BattlesTab tag={tag!} />}
          {activeTab === "analytics" && (
            <AnalyticsTab profile={data} tag={tag!} />
          )}
          {activeTab === "club" && <ClubTab player={data.player} />}
          {activeTab === "guide" && <GuideTab onNavigateTab={setTab} />}
        </motion.div>
      </AnimatePresence>

      <BrawlerSheet
        brawler={openBrawler}
        tag={tag!}
        open={openBrawler !== null}
        onClose={() => setBrawlerParam(null)}
      />
      <ShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        profile={data}
      />
    </div>
  );
}
