export type GreetingKey = "morning" | "afternoon" | "evening";

export const greetingKey = (hour: number): GreetingKey => {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 18) return "afternoon";
    return "evening";
};
