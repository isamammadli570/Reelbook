import {describe, expect, it} from "vitest";
import {createExclusiveQueue} from "@/lib/exclusive";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createExclusiveQueue", () => {
    it("starts a task only after the one before it has finished", async () => {
        const run = createExclusiveQueue();
        const events: string[] = [];
        let release = () => undefined as void;
        const first = run(async () => {
            events.push("first:start");
            await new Promise<void>((resolve) => {
                release = resolve;
            });
            events.push("first:end");
        });
        const second = run(async () => {
            events.push("second:start");
        });

        await tick();
        expect(events).toEqual(["first:start"]);
        release();
        await Promise.all([first, second]);
        expect(events).toEqual(["first:start", "first:end", "second:start"]);
    });

    it("hands each caller its own task's result", async () => {
        const run = createExclusiveQueue();
        await expect(Promise.all([run(async () => 1), run(async () => "two")])).resolves.toEqual([1, "two"]);
    });

    it("keeps going after a failure, which only its own caller sees", async () => {
        const run = createExclusiveQueue();
        const failed = run(async () => {
            throw new Error("offline");
        });
        const next = run(async () => "done");
        await expect(failed).rejects.toThrow("offline");
        await expect(next).resolves.toBe("done");
    });
});
