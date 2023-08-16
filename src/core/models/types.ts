import { z } from "zod";

export const SupportedRunCodeLanguages = z.union([
    z.literal("python"),
    z.literal("ricklang"),
    z.literal("node"),
    z.literal("c"),
]);

export const RunCodeJobValidator = z.object({
    language: SupportedRunCodeLanguages,
    code: z.string(),
    input: z.string(),
    enviromentVariables: z.record(z.string(), z.string()).default({}),
});

export const TestCodeJobValidator = z.object({
    code: z.string(),
    problem_id: z.string().uuid(),
});

type Test = [any[], any];

export type TestCodeData = {
    function_name: string;
    time_limit: number;
    memory_limit: number;
    tests: Test[];
};
