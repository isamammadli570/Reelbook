import type {CrewMember} from "@/api/people.api";
import type {SeasonSummary} from "@/api/series.api";

/** TMDB scores of 0 mean "no votes yet", not a bad film. */
export const formatScore = (voteAverage: number): string => (voteAverage > 0 ? voteAverage.toFixed(1) : "—");

export const splitRuntime = (totalMinutes: number): {hours: number; minutes: number} => ({
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
});

export const directorNames = (crew: CrewMember[]): string[] => crew.filter((member) => member.job === "Director").map((member) => member.name);

/** Regular seasons in order, with "Specials" (season 0) moved to the end where they bother no one. */
export const orderSeasons = (seasons: SeasonSummary[]): SeasonSummary[] => {
    const regular = seasons.filter((season) => season.season_number > 0).sort((a, b) => a.season_number - b.season_number);
    const specials = seasons.filter((season) => season.season_number === 0);
    return [...regular, ...specials];
};

/** The first season worth opening: the latest one that has already aired, else the first one. */
export const defaultSeasonNumber = (seasons: SeasonSummary[], today: Date = new Date()): number | null => {
    const regular = orderSeasons(seasons).filter((season) => season.season_number > 0);
    const aired = regular.filter((season) => season.air_date && new Date(season.air_date) <= today);
    return aired.at(-1)?.season_number ?? regular[0]?.season_number ?? seasons[0]?.season_number ?? null;
};

/** An episode counts as out once its air date (a plain `YYYY-MM-DD`) is today or earlier. */
export const isReleased = (airDate: string | null | undefined, today: Date = new Date()): boolean => {
    if (!airDate) return false;
    const pad = (value: number) => String(value).padStart(2, "0");
    const localToday = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    return airDate <= localToday;
};

/** Turns `#rrggbb` into an `rgba()` with the given alpha, for fading a surface colour to transparent. */
export const withAlpha = (hex: string, alpha: number): string => {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
    const [red, green, blue] = [0, 2, 4].map((start) => parseInt(full.slice(start, start + 2), 16));
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};
