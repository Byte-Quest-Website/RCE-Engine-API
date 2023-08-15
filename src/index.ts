import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import express, { type Router } from "express";

import routes from "./routes";

function getExpressApp(routes: Router[]) {
    const app = express();

    const limiter = rateLimit({
        max: 30, // 30 requests
        windowMs: 60 * 1000, // per minute
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            success: false,
            detail: "Rate limited exceeded: 30/minute",
            tip: "Slow down buddy its really not that deep",
        },
        statusCode: 429,
    });

    // Include Middleware
    app.use(limiter);
    app.use(cors());
    app.use(express.json());

    // Include Routes
    routes.map((route) => app.use(route));

    return app;
}

function main() {
    const PORT = 8443;
    const server = http.createServer(getExpressApp(routes));

    server.listen(PORT, () =>
        console.log(`Server Started!\nListening on http://localhost:${PORT}`)
    );
}

main();
