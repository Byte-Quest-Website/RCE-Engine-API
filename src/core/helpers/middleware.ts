import { z } from "zod";
import { createHash } from "crypto";
import { Request, Response, NextFunction } from "express";

import { redis } from "../db/connections";
import { RunCodeJobValidator } from "../models/types";

export async function cacheRunCode(
    req: Request<{}, {}, z.infer<typeof RunCodeJobValidator>, {}>,
    res: Response,
    next: NextFunction
) {
    if (req.body.use_cache === false) {
        return next();
    }

    const key = createHash("sha256")
        .update(JSON.stringify(req.body))
        .digest("hex");

    const data = await redis.get(key);
    if (!data) {
        return next();
    }

    return res.send(JSON.parse(data));
}
