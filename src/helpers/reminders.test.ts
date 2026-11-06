import {describe, expect, it} from "vitest";
import {diffReminders, planReminders, reminderId} from "@/helpers/reminders";
import type {UpcomingEpisode} from "@/helpers/calendar";

const episode = (seriesId: number, number: number, airDate: string): UpcomingEpisode => ({
    seriesId,
    title: `Show ${seriesId}`,
    posterPath: null,
    network: null,
    season: 1,
    episode: number,
    episodeName: `Episode ${number}`,
    airDate,
    runtime: null,
});

describe("planReminders", () => {
    const now = new Date(2026, 10, 6, 12, 0);

    it("schedules the air day at the reminder hour and skips mornings already gone", () => {
        const planned = planReminders([episode(1, 2, "2026-11-08"), episode(1, 1, "2026-11-06"), episode(2, 1, "2026-11-07")], now);
        expect(planned.map((item) => item.id)).toEqual(["episode:2:1:1", "episode:1:1:2"]);
        expect(planned[0].date).toEqual(new Date(2026, 10, 7, 10));
    });

    it("keeps only the soonest within the limit", () => {
        const episodes = [episode(1, 3, "2026-11-20"), episode(1, 1, "2026-11-10"), episode(1, 2, "2026-11-15")];
        expect(planReminders(episodes, now, 10, 2).map((item) => item.episode.episode)).toEqual([1, 2]);
    });
});

describe("diffReminders", () => {
    it("cancels stale reminders, adds new ones and leaves other notifications alone", () => {
        const planned = planReminders([episode(1, 1, "2026-11-10"), episode(1, 2, "2026-11-17")], new Date(2026, 10, 6));
        const {cancel, add} = diffReminders([reminderId(episode(1, 1, "")), reminderId(episode(9, 9, "")), "something-else"], planned);
        expect(cancel).toEqual(["episode:9:1:9"]);
        expect(add.map((item) => item.id)).toEqual(["episode:1:1:2"]);
    });
});
