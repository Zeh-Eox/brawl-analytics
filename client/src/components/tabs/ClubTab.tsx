import { useNavigate } from "react-router-dom";
import type { ClubMemberRole, Player } from "../../types/brawlstars";
import { useClub, useClubSummary } from "../../api/queries";
import { Card } from "../ui/Card";
import { Stat } from "../ui/Stat";
import { Img } from "../ui/Img";
import { Skeleton } from "../ui/Skeleton";
import { ErrorState } from "../ui/ErrorState";
import { cdn } from "../../utils/cdn";
import { fmtNum, fmtCompact } from "../../utils/format";
import { displayTag, normalizeTag } from "../../utils/tag";
import { IconClub, IconTrophy } from "../ui/icons";

const CLUB_TYPE: Record<string, string> = {
  open: "Ouvert",
  inviteOnly: "Sur invitation",
  closed: "Fermé",
  unknown: "—",
};

const ROLE: Record<ClubMemberRole, { label: string; color: string }> = {
  president: { label: "Président", color: "text-gold" },
  vicePresident: { label: "Vice-président", color: "text-magenta" },
  senior: { label: "Sénior", color: "text-cyan" },
  member: { label: "Membre", color: "text-muted" },
  notMember: { label: "—", color: "text-muted" },
  unknown: { label: "—", color: "text-muted" },
};

export function ClubTab({ player }: { player: Player }) {
  const navigate = useNavigate();
  const clubRef = "tag" in player.club ? player.club : null;
  const clubTag = clubRef ? normalizeTag(clubRef.tag) : undefined;

  const club = useClub(clubTag);
  const summary = useClubSummary(clubTag);

  if (!clubRef) {
    return (
      <div className="anim-in flex flex-col items-center gap-3 px-6 py-16 text-center">
        <div className="text-dim"><IconClub size={48} /></div>
        <div className="display text-xl text-white">Sans club</div>
        <p className="max-w-xs text-sm text-text-2">
          Ce joueur n'a rejoint aucun club pour le moment.
        </p>
      </div>
    );
  }

  if (club.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-16" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (club.isError || !club.data) {
    return (
      <ErrorState error={club.error} onRetry={() => void club.refetch()} />
    );
  }

  const c = club.data;
  const members = [...c.members].sort((a, b) => b.trophies - a.trophies);

  return (
    <div className="space-y-4">
      {/* club header */}
      <div className="flex items-center gap-4 rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/12 to-transparent p-4">
        <Img
          src={cdn.clubBadge(c.badgeId)}
          alt={c.name}
          wrapperClassName="h-14 w-14 shrink-0"
          fallback={<span className="text-text-2"><IconClub size={26} /></span>}
        />
        <div className="min-w-0 flex-1">
          <div className="display truncate text-xl text-white">{c.name}</div>
          <div className="font-mono text-[12px] text-dim">
            {displayTag(c.tag)} · {CLUB_TYPE[c.type] ?? c.type}
          </div>
        </div>
      </div>

      {c.description && (
        <p className="text-[13px] leading-relaxed text-text-2">
          {c.description}
        </p>
      )}

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <Stat align="center" accent="gold" value={<span className="inline-flex items-center gap-0.5"><IconTrophy size={16} />{fmtCompact(c.trophies)}</span>} label="Total" />
        </Card>
        <Card>
          <Stat
            align="center"
            value={summary.data ? fmtNum(summary.data.averageTrophies) : "—"}
            label="Moyenne"
          />
        </Card>
        <Card>
          <Stat
            align="center"
            value={
              <>
                {c.members.length}
                <span className="text-dim text-base">/30</span>
              </>
            }
            label="Membres"
          />
        </Card>
      </div>

      {c.requiredTrophies > 0 && (
        <div className="text-[12px] text-dim">
          Requis pour rejoindre :{" "}
          <span className="inline-flex items-center gap-0.5 text-gold"><IconTrophy size={12} />{fmtNum(c.requiredTrophies)}</span>
        </div>
      )}

      {/* members */}
      <div>
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-muted">
          Membres
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {members.map((m, i) => {
            const role = ROLE[m.role] ?? ROLE.member;
            const norm = normalizeTag(m.tag);
            return (
              <button
                key={m.tag}
                onClick={() => navigate(`/player/${norm}`)}
                className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left card-hover"
              >
                <span className="w-6 shrink-0 font-mono text-[12px] text-dim">
                  {i + 1}
                </span>
                <Img
                  src={m.icon?.id ? cdn.playerIcon(m.icon.id) : undefined}
                  alt={m.name}
                  fit="cover"
                  wrapperClassName="h-8 w-8 shrink-0 rounded-lg bg-surface-2"
                  fallback={
                    <span className="text-[10px] text-gold">
                      {m.name.slice(0, 2).toUpperCase()}
                    </span>
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-bold text-text">
                    {m.name}
                  </div>
                  <div className={`text-[10px] font-semibold ${role.color}`}>
                    {role.label}
                  </div>
                </div>
                <div className="display text-[13px] text-gold">
<span className="inline-flex items-center gap-0.5"><IconTrophy size={12} />{fmtNum(m.trophies)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
