"use client";

import * as React from "react";
import { Gamepad2, Info, Play, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useBooster } from "@/lib/gb/store";
import { GAMES } from "@/lib/gb/model/games";
import { fmtBytesMB } from "@/lib/gb/format";
import type { Game } from "@/lib/gb/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Chip, GameIcon, NeonButton, NeonCard, ScreenHeader, SegTabs } from "../ui";
import GameProfileSheet from "../GameProfileSheet";

const S = {
  fa: {
    title: "بازی‌های نصب‌شده",
    pm: "PackageManager",
    search: "جست‌وجوی نام بازی یا پکیج...",
    all: "همه",
    favorites: "موردعلاقه",
    note: "شناسایی بازی‌ها شبیه‌سازی PackageManager اندروید است؛ در نسخه اندروید با مجوز مربوط انجام می‌شود.",
    selected: "انتخاب‌شده",
    favAdd: "افزودن به موردعلاقه‌ها",
    favRemove: "حذف از موردعلاقه‌ها",
    emptySearch: "بازی‌ای با این عبارت پیدا نشد",
    emptySearchSub: "عبارت دیگری را جست‌وجو کنید یا فیلتر «همه» را برگزینید",
    emptyFav: "هنوز بازی موردعلاقه‌ای ندارید",
    emptyFavSub: "با لمس ستاره، بازی‌های دلخواه را نشانه‌گذاری کنید",
    runGame: "اجرای بازی",
    ready: "آماده اجرا — پروفایل اختصاصی فعال است",
    selectToast: (name: string) => `${name} به‌عنوان بازی فعال انتخاب شد`,
    cat: { battle: "نبرد", moba: "موبا", strategy: "استراتژی", racing: "مسابقه", sandbox: "سندباکس", sports: "ورزشی" },
  },
  en: {
    title: "Installed Games",
    pm: "PackageManager",
    search: "Search game or package name...",
    all: "All",
    favorites: "Favorites",
    note: "Game detection is an Android PackageManager simulation; the Android build performs it with the related permission.",
    selected: "Selected",
    favAdd: "Add to favorites",
    favRemove: "Remove from favorites",
    emptySearch: "No game matches your search",
    emptySearchSub: "Try another term or switch back to the “All” filter",
    emptyFav: "No favorite games yet",
    emptyFavSub: "Tap the star to mark games as favorites",
    runGame: "Launch game",
    ready: "Ready to launch — custom profile active",
    selectToast: (name: string) => `${name} set as your active game`,
    cat: { battle: "Battle", moba: "MOBA", strategy: "Strategy", racing: "Racing", sandbox: "Sandbox", sports: "Sports" },
  },
} as const;

type FilterTab = "all" | "fav";

export default function LibraryScreen() {
  const lang = useBooster((s) => s.settings.lang);
  const t = S[lang];
  const favorites = useBooster((s) => s.favorites);
  const selectedGameId = useBooster((s) => s.selectedGameId);
  const goBack = useBooster((s) => s.goBack);
  const selectGame = useBooster((s) => s.selectGame);
  const toggleFavorite = useBooster((s) => s.toggleFavorite);
  const startBoost = useBooster((s) => s.startBoost);

  const [query, setQuery] = React.useState("");
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [profileGame, setProfileGame] = React.useState<Game | null>(null);

  const q = query.trim().toLowerCase();
  const list = GAMES.filter(
    (g) =>
      (g.name.toLowerCase().includes(q) || g.packageId.toLowerCase().includes(q)) &&
      (tab === "all" || favorites.includes(g.id))
  );

  const selectedGame = GAMES.find((g) => g.id === selectedGameId) ?? null;
  const emptyTitle = tab === "fav" && q === "" ? t.emptyFav : t.emptySearch;
  const emptySub = tab === "fav" && q === "" ? t.emptyFavSub : t.emptySearchSub;

  const openGame = (game: Game) => {
    selectGame(game.id);
    toast.success(t.selectToast(game.name));
    setProfileGame(game);
  };

  return (
    <div className="relative flex min-h-full flex-col">
      <ScreenHeader
        title={t.title}
        onBack={goBack}
        action={
          <Chip color="purple" className="px-2 py-0.5 text-[9px]">
            <span dir="ltr" className="font-mono">{t.pm}</span>
          </Chip>
        }
      />

      <div className="flex-1 space-y-4 px-4 pb-6 pt-4">
        {/* search */}
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-gb-dim" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="border-gb-border bg-gb-surface2/60 ps-9 text-[13px] text-gb-text placeholder:text-gb-dim focus-visible:border-gb-purple/60 focus-visible:ring-gb-purple/20"
          />
        </div>

        {/* filter: all | favorites */}
        <SegTabs
          items={[
            { id: "all", label: t.all },
            { id: "fav", label: t.favorites },
          ]}
          value={tab}
          onChange={(id) => setTab(id === "fav" ? "fav" : "all")}
        />

        {/* PackageManager simulation note */}
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-gb-dim">
          <Info className="mt-0.5 size-3 shrink-0" />
          {t.note}
        </p>

        {/* games grid / empty state */}
        {list.length === 0 ? (
          <div className="anim-fade-up flex flex-col items-center gap-2 py-12 text-center">
            <span className="grid size-16 place-items-center rounded-2xl border border-dashed border-gb-border text-gb-dim">
              <Gamepad2 className="size-8" />
            </span>
            <p className="text-[13px] font-bold text-gb-text">{emptyTitle}</p>
            <p className="max-w-[250px] text-[10px] leading-relaxed text-gb-dim">{emptySub}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((game) => {
              const isFav = favorites.includes(game.id);
              const isSelected = selectedGameId === game.id;
              return (
                <NeonCard
                  key={game.id}
                  glow={isSelected ? "green" : undefined}
                  onClick={isSelected ? undefined : () => openGame(game)}
                  className={cn("p-3", isSelected && "pb-9")}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(game.id);
                    }}
                    aria-label={isFav ? t.favRemove : t.favAdd}
                    className="absolute end-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-gb-bg/70 backdrop-blur-sm transition-transform hover:scale-110"
                  >
                    <Star className={cn("size-4 transition-colors", isFav ? "fill-gb-amber text-gb-amber" : "text-gb-dim")} />
                  </button>

                  <GameIcon game={game} size={44} />
                  <div className="mt-2 truncate text-[12px] font-bold text-gb-text">{game.name}</div>
                  <div className="mt-0.5 text-[10px] text-gb-dim">{fmtBytesMB(game.sizeMB, lang)}</div>
                  <div className="mt-2">
                    <Chip color="cyan" className="text-[9px]">{t.cat[game.category]}</Chip>
                  </div>

                  {isSelected ? (
                    <div className="absolute inset-x-2 bottom-2 flex justify-center">
                      <Chip color="green" dot className="text-[9px]">{t.selected}</Chip>
                    </div>
                  ) : null}
                </NeonCard>
              );
            })}
          </div>
        )}
      </div>

      {/* selected-game launcher bar (pinned above content end) */}
      {selectedGame ? (
        <div className="sticky bottom-0 z-20 mt-auto bg-gradient-to-t from-gb-bg via-gb-bg/95 to-transparent px-4 pb-3 pt-3">
          <NeonCard glow="purple" className="p-3">
            <div className="flex items-center gap-3">
              <GameIcon game={selectedGame} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-black text-gb-text">{selectedGame.name}</div>
                <div className="truncate text-[10px] text-gb-dim">{t.ready}</div>
              </div>
              <NeonButton size="sm" color="green" onClick={() => void startBoost(selectedGame.id)}>
                <Play className="size-3.5" />
                {t.runGame}
              </NeonButton>
            </div>
          </NeonCard>
        </div>
      ) : null}

      <GameProfileSheet game={profileGame} onClose={() => setProfileGame(null)} />
    </div>
  );
}
