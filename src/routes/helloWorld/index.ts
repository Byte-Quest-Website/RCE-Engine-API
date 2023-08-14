import { z } from "zod";
import { Router } from "express";
import { validateRequest } from "zod-express-middleware";

const helloWorldRouter = Router();

helloWorldRouter.get(
    "/",
    validateRequest({
        query: z.object({
            name: z.string(),
        }),
    }),
    (req, res) => {
        res.send({
            success: true,
            detail: `Hello ${req.query.name}`,
        });
    }
);

export default helloWorldRouter;
