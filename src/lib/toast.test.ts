import {beforeEach, describe, expect, it} from "vitest";
import {toast} from "@/lib/toast";

beforeEach(() => toast.dismiss());

describe("toast", () => {
    it("shows one at a time: a new toast replaces the one on screen", () => {
        toast.show({message: "First"});
        const second = toast.success("Second");
        expect(toast.current()).toMatchObject({id: second, message: "Second", tone: "success"});
    });

    it("gives toasts with an action more time to reach it", () => {
        toast.show({message: "Saved"});
        const plain = toast.current()?.duration ?? 0;
        toast.show({message: "Removed", action: {label: "Undo", onPress: () => undefined}});
        expect(toast.current()?.duration).toBeGreaterThan(plain);
    });

    it("only dismisses the toast it was asked to, so a late timer cannot hide a newer one", () => {
        const old = toast.show({message: "Old"});
        const fresh = toast.show({message: "New"});
        toast.dismiss(old);
        expect(toast.current()?.id).toBe(fresh);
        toast.dismiss(fresh);
        expect(toast.current()).toBeNull();
    });
});
