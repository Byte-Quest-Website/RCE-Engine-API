import { Prisma } from "@prisma/client";
import { prisma, redis } from "../db/connections";
import { TestCodeData, TestCodeDataValidator } from "../models/types";

export async function fetchProblem(problem_id: string): Promise<TestCodeData> {
    const cachedProblem = await redis.get(`problem-${problem_id}`);
    if (cachedProblem) {
        let parsed = TestCodeDataValidator.safeParse(JSON.parse(cachedProblem));
        if (parsed.success) {
            return parsed.data;
        }
    }

    const dbProblem = await prisma.problem.findUnique({
        where: { id: problem_id },
    });
    if (!dbProblem) {
        throw Error();
    }

    const data = {
        function_name: dbProblem.functionName,
        time_limit: dbProblem.timeLimit,
        memory_limit: dbProblem.memoryLimit,
        tests: dbProblem.tests as Prisma.JsonArray,
    };

    let parsed = TestCodeDataValidator.safeParse(data);
    if (!parsed.success) {
        throw Error();
    }

    // cache that shit
    await redis.set(`problem-${problem_id}`, JSON.stringify(parsed.data));

    return parsed.data;
}
