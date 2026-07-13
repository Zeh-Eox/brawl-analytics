import { ApiError } from "../../api/client";
import { cn } from "../../utils/cn";
import { IconWarning, IconSearch, IconPlug, IconClock, type IconProps } from "./icons";

interface Props {
  error: unknown;
  onRetry?: () => void;
  onHome?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({ error, onRetry, onHome, title, className }: Props) {
  const isApi = error instanceof ApiError;
  const status = isApi ? error.status : undefined;
  const raw = (error instanceof Error ? error.message : "") ?? "";

  const isInvalidIp =
    status === 403 || /invalidip|accessdenied|\bip\b/i.test(raw);
  const isNotFound = status === 404;
  const isRate = status === 429;

  let Icon: (p: IconProps) => React.ReactNode = IconWarning;
  let headline = title ?? "Oups…";
  let body = raw || "Une erreur inattendue est survenue.";

  if (isNotFound) {
    Icon = IconSearch;
    headline = title ?? "Joueur introuvable";
    body =
      "Aucun joueur ne correspond à ce tag. Vérifie les caractères (pas de O ni de I — utilise 0 et 1).";
  } else if (isInvalidIp) {
    Icon = IconPlug;
    headline = title ?? "Connexion à l'API bloquée";
    body =
      "Notre serveur doit autoriser son adresse IP auprès de l'API Supercell. Ce n'est pas ta faute — réessaie dans un instant pendant qu'on corrige la config du proxy.";
  } else if (isRate) {
    Icon = IconClock;
    headline = title ?? "Trop de requêtes";
    body = "Patiente quelques secondes avant de réessayer.";
  } else if (status === 502 || status === 504) {
    Icon = IconPlug;
    headline = title ?? "API Brawl Stars indisponible";
    body = "Le service officiel ne répond pas. Réessaie dans un moment.";
  }

  return (
    <div
      className={cn(
        "anim-in flex flex-col items-center gap-4 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="text-muted"><Icon size={52} /></div>
      <h2 className="display text-2xl text-white">{headline}</h2>
      <p className="max-w-sm text-sm leading-relaxed text-text-2">{body}</p>
      {isInvalidIp && (
        <div className="max-w-sm rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-left text-[12.5px] leading-relaxed text-text-2">
          Astuce dev : la clé API Brawl Stars est verrouillée sur une IP. Mets
          l'IP publique du proxy à jour sur developer.brawlstars.com.
        </div>
      )}
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-xl border border-line-strong bg-white/5 px-5 py-2.5 text-sm font-bold text-text hover:bg-white/10"
          >
            Réessayer
          </button>
        )}
        {onHome && (
          <button
            onClick={onHome}
            className="rounded-xl bg-gold px-5 py-2.5 text-sm font-black text-app hover:bg-gold-soft"
          >
            ← Nouvelle recherche
          </button>
        )}
      </div>
    </div>
  );
}
