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
    data: z.string(),
    replyBack: z.boolean().default(false),
});
