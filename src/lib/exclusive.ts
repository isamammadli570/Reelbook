/**
 * Runs async tasks one at a time, in the order they were asked for. A task that fails does not stop the ones
 * after it; its caller still gets the failure.
 */
export const createExclusiveQueue = () => {
    let tail: Promise<unknown> = Promise.resolve();

    return <T>(task: () => Promise<T>): Promise<T> => {
        const run = tail.then(task, task);
        tail = run.catch(() => undefined);
        return run;
    };
};
