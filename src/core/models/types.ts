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
    use_cache: z.boolean().default(true),
    enviromentVariables: z.record(z.string(), z.string()).default({}),
});

export const TestCodeJobValidator = z.object({
    code: z.string(),
    problem_id: z.string().uuid(),
    mode: z.union([z.literal("run"), z.literal("submit")]).default("submit"),
});

export const TestCodeDataValidator = z.object({
    function_name: z.string(),
    time_limit: z.number(),
    memory_limit: z.number(),
    tests: z.tuple([z.any().array(), z.any()]).array(),
});

export type TestCodeData = z.infer<typeof TestCodeDataValidator>;
