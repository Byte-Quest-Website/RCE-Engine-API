import http from "http";
import cors from "cors";
import express, { type Router } from "express";

import routes from "./routes";

function getExpressApp(routes: Router[]) {
    const app = express();

    // Middleware
    app.use(cors());
    app.use(express.json());

    // Routes
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
