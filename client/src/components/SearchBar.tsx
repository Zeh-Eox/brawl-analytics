import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { validateTag, displayTag } from "../utils/tag";
import { loadRecents, pushRecent } from "../utils/recents";
import { loadFavorites } from "../utils/favorites";
import { cn } from "../utils/cn";
import { Avatar } from "./ui/Avatar";
import { fmtCompact } from "../utils/format";
import { IconArrowRight, IconTrophy, IconStar, IconWarning } from "./ui/icons";

type Variant = "hero" | "compact";

export function SearchBar({
  variant = "hero",
  autoFocus = false,
}: {
  variant?: Variant;
  autoFocus?: boolean;
}) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recents, setRecents] = useState(() => loadRecents());
  const [favorites, setFavorites] = useState(() => loadFavorites());

  const hero = variant === "hero";

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const validation = validateTag(value);
  const showError = touched && value.length > 0 && !validation.ok;

  function go(raw: string, name?: string) {
    const v = validateTag(raw);
    if (!v.ok) {
      setTouched(true);
      return;
    }
    pushRecent({ tag: v.normalized, name });
    setRecents(loadRecents());
    navigate(`/player/${v.normalized}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(value);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") inputRef.current?.blur();
  }

  const panelOpen = hero && focused && (favorites.length > 0 || recents.length > 0);

  return (
    <div className={cn("relative w-full", hero ? "max-w-xl" : "max-w-sm")}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "group flex items-center gap-2 bg-surface border-2 transition-colors",
          hero
            ? "rounded-2xl pl-4 pr-2 h-15 py-2 shadow-[0_8px_30px_-10px_rgba(255,192,21,0.18)]"
            : "rounded-xl pl-3 pr-1.5 h-11",
          showError
            ? "border-danger"
            : focused
              ? "border-gold"
              : "border-line",
        )}
      >
        <span
          className={cn(
            "display text-gold select-none",
            hero ? "text-xl" : "text-base",
          )}
        >
          #
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setFavorites(loadFavorites());
            setRecents(loadRecents());
          }}
          onBlur={() => {
            setTouched(true);
            setTimeout(() => setFocused(false), 140);
          }}
          onKeyDown={onKey}
          placeholder={hero ? "8QRPPCLR" : "Ton tag"}
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
          aria-label="Tag joueur"
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none uppercase text-text placeholder:text-dim font-mono tracking-wider",
            hero ? "text-lg font-bold" : "text-sm font-semibold",
          )}
        />
        <button
          type="submit"
          aria-label="Voir les stats"
          className={cn(
            "shrink-0 grid place-items-center font-black text-app transition-transform active:scale-95 bg-gradient-to-br from-gold to-gold-deep",
            hero ? "w-11 h-11 rounded-xl" : "w-8 h-8 rounded-lg",
          )}
        >
          <IconArrowRight size={hero ? 20 : 16} />
        </button>
      </form>

      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-2 top-full mt-2 flex items-center gap-1.5 text-danger text-xs font-semibold"
          >
            <IconWarning size={13} />
            <span>{validation.reason}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {hero && !showError && !panelOpen && (
        <div className="mt-2.5 pl-1 text-[12.5px] text-dim">
          ex&nbsp;:{" "}
          <button
            type="button"
            onClick={() => setValue("8QRPPCLR")}
            className="font-mono text-cyan"
          >
            #8QRPPCLR
          </button>{" "}
          · 3 à 15 caractères
        </div>
      )}

      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-0 right-0 top-full mt-3 z-40 surface p-3 shadow-2xl"
          >
            {favorites.length > 0 && (
              <>
                <Divider>Épinglés</Divider>
                <div className="flex flex-col gap-2">
                  {favorites.map((f) => (
                    <button
                      key={f.tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(f.tag, f.name);
                      }}
                      className="flex items-center gap-3 rounded-xl border border-gold/15 bg-gradient-to-r from-gold/8 to-transparent px-3 py-2 text-left"
                    >
                      <Avatar
                        iconId={f.iconId}
                        name={f.name}
                        rounded="rounded-lg"
                        className="w-9 h-9 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-text">
                          {f.name}
                        </div>
                        <div className="font-mono text-[11px] text-dim">
                          {displayTag(f.tag)}
                        </div>
                      </div>
                      {typeof f.trophies === "number" && (
                        <span className="display text-gold text-sm">
                          <span className="inline-flex items-center gap-0.5"><IconTrophy size={13} />{fmtCompact(f.trophies)}</span>
                        </span>
                      )}
                      <IconStar size={13} filled className="text-gold" />
                    </button>
                  ))}
                </div>
              </>
            )}

            {recents.length > 0 && (
              <>
                <Divider className={favorites.length ? "mt-4" : undefined}>
                  Récents
                </Divider>
                <div className="flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <button
                      key={r.tag}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        go(r.tag, r.name);
                      }}
                      className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-1.5"
                    >
                      {r.name && (
                        <span className="text-[13px] font-semibold text-text">
                          {r.name}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-dim">
                        {displayTag(r.tag)}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-2.5 flex items-center gap-2", className)}>
      <span className="text-[11px] font-bold uppercase tracking-widest text-dim">
        {children}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
