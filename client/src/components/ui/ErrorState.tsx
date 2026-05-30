import { Card } from "./Card";
import { ApiError } from "../../api/client";

interface Props {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({ error, onRetry, title }: Props) {
  const isApi = error instanceof ApiError;
  const status = isApi ? error.status : undefined;
  const message =
    isApi && error.message
      ? error.message
      : error instanceof Error
        ? error.message
        : "Une erreur inattendue est survenue.";

  const headline =
    title ??
    (status === 404
      ? "Joueur introuvable"
      : status === 429
        ? "Trop de requêtes"
        : status === 504 || status === 502
          ? "API Brawl Stars indisponible"
          : "Oups…");

  return (
    <Card className="text-center" padding="lg">
      <div className="display text-3xl text-gradient-m mb-2">{headline}</div>
      <p className="text-text-muted text-sm max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-yellow text-bg-base font-bold px-5 py-2.5 hover:bg-brand-yellow-soft transition-colors"
        >
          Réessayer
        </button>
      )}
    </Card>
  );
}
