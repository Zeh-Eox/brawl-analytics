import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { validateTag, displayTag } from "../utils/tag";
import { cn } from "../utils/cn";

const RECENT_KEY = "brawl-analytics:recent-tags";

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(tag: string) {
  try {
    const cur = readRecent().filter((t) => t !== tag);
    const next = [tag, ...cur].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* localStorage might be disabled */
  }
}

type Variant = "hero" | "compact";

interface Props {
  variant?: Variant;
  autoFocus?: boolean;
}

export function SearchBar({ variant = "hero", autoFocus = false }: Props) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const [recents, setRecents] = useState<string[]>(() => readRecent());
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const validation = validateTag(value);
  const showError = touched && value.length > 0 && !validation.ok;
  const hero = variant === "hero";

  function go(tagRaw: string) {
    const v = validateTag(tagRaw);
    if (!v.ok) {
      setTouched(true);
      return;
    }
    writeRecent(v.normalized);
    setRecents(readRecent());
    navigate(`/player/${v.normalized}`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    go(value);
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") inputRef.current?.blur();
  }

  return (
    <div className={cn("relative w-full", hero ? "max-w-2xl" : "max-w-md")}>
      <form
        onSubmit={onSubmit}
        className={cn(
          "group flex items-center gap-2 surface-elevated transition-all",
          hero
            ? "rounded-2xl pl-5 pr-2 py-2.5 focus-within:glow-yellow"
            : "rounded-full pl-4 pr-1.5 py-1.5",
          showError && "ring-1 ring-danger/60",
        )}
      >
        <span
          className={cn(
            "display select-none",
            hero ? "text-3xl text-brand-yellow" : "text-xl text-brand-yellow",
          )}
        >
          #
        </span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTouched(true);
            // Defer so we can detect clicks on the recents popover.
            setTimeout(() => setFocused(false), 120);
          }}
          onKeyDown={onKey}
          placeholder="Ton tag joueur"
          spellCheck={false}
          autoCapitalize="characters"
          autoCorrect="off"
          aria-label="Player tag"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-text-dim text-text-base",
            hero
              ? "text-2xl font-bold uppercase tracking-wider"
              : "text-sm font-semibold uppercase tracking-wider",
          )}
        />
        <button
          type="submit"
          className={cn(
            "shrink-0 inline-flex items-center justify-center gap-2 font-bold transition-all",
            hero
              ? "h-12 px-6 rounded-xl bg-brand-yellow text-bg-base hover:bg-brand-yellow-soft active:scale-95 text-base"
              : "h-9 px-4 rounded-full bg-brand-yellow text-bg-base hover:bg-brand-yellow-soft active:scale-95 text-sm",
          )}
        >
          {hero ? "Voir mes stats" : "GO"}
        </button>
      </form>

      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={cn(
              "absolute left-3 text-danger text-xs font-medium",
              hero ? "top-full mt-2" : "top-full mt-1.5",
            )}
          >
            {validation.reason}
          </motion.div>
        )}
      </AnimatePresence>

      {hero && focused && recents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-3 left-0 right-0 surface rounded-xl p-2 z-30"
        >
          <div className="text-text-dim text-[10px] uppercase tracking-wider font-semibold px-2 pb-1.5">
            Recherches récentes
          </div>
          <ul>
            {recents.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(tag);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-white/5 flex items-center justify-between"
                >
                  <span className="display text-brand-yellow text-base">
                    {displayTag(tag)}
                  </span>
                  <span className="text-text-dim text-xs">↵</span>
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}
