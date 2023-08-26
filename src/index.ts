import "dotenv/config";
import http from "http";
import cors from "cors";
import https from "https";
import { join } from "path";
import { readFileSync } from "fs";
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

function getCertificates(): { key: string; cert: string } {
    const CERT_DIR = join(__dirname, "..", "certs/");

    const certificate = readFileSync(join(CERT_DIR, "cert.pem")).toString();
    const privateKey = readFileSync(join(CERT_DIR, "key.pem")).toString();

    return { key: privateKey, cert: certificate };
}

function main() {
    const PORT = 8443;
    const server = http.createServer(getExpressApp(routes));

    server.listen(PORT, () =>
        console.log(`Server Started!\nListening on http://localhost:${PORT}`)
    );

    if (process.env.PROD === "true") {
        const httpsServer = https.createServer(
            getCertificates(),
            getExpressApp(routes)
        );
        httpsServer.listen(PORT, "0.0.0.0", () =>
            console.log(`Server Started!\nListening on https://0.0.0.0:${PORT}`)
        );
    }
}

main();
