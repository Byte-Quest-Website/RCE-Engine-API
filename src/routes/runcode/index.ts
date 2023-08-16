import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { createHash } from "crypto";
import { EventEmitter } from "events";
import { connect, Channel } from "amqplib";
import { validateRequest } from "zod-express-middleware";

import { redis } from "../../core/db/connections";
import { cacheRunCode } from "../../core/helpers/middleware";
import { RunCodeJobValidator } from "../../core/models/types";

const runCodeRouter = Router();

const QUEUE_NAME = "run_code";
const REPLY_QUEUE = "amq.rabbitmq.reply-to";

const connectionData: {
    channel: Channel | null;
    responseEmitter: EventEmitter | null;
} = { channel: null, responseEmitter: null };

async function getConnection() {
    if (connectionData.channel && connectionData.responseEmitter) {
        return connectionData;
    }

    const connection = await connect("amqp://localhost");
    const channel = await connection.createChannel();
    const responseEmitter = new EventEmitter();

    await channel.assertQueue(QUEUE_NAME, { durable: false });
    responseEmitter.setMaxListeners(0);

    channel.consume(
        REPLY_QUEUE,
        (msg) => {
            if (!msg) {
                return;
            }
            responseEmitter.emit(
                msg.properties.correlationId,
                msg.content.toString("utf8")
            );
        },
        { noAck: true }
    );

    connectionData.channel = channel;
    connectionData.responseEmitter = responseEmitter;

    return connectionData;
}

runCodeRouter.post(
    "/runcode",
    validateRequest({ body: RunCodeJobValidator }),
    cacheRunCode,
    async (req, res) => {
        const data = { jobID: uuidv4(), replyBack: true, ...req.body };
        const correlationId = uuidv4();
        const { channel, responseEmitter } = await getConnection();

        const responsePromise: Promise<string> = new Promise((resolve) => {
            responseEmitter!.once(correlationId, resolve);
            channel!.sendToQueue(
                QUEUE_NAME,
                Buffer.from(JSON.stringify(data)),
                {
                    correlationId,
                    replyTo: REPLY_QUEUE,
                    persistent: true,
                }
            );
        });

        const timeoutPromise: Promise<string> = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error("Timeout waiting for response"));
            }, 20_000);
        });

        try {
            const response: string = await Promise.race([
                responsePromise,
                timeoutPromise,
            ]);

            const key = createHash("sha256")
                .update(JSON.stringify(req.body))
                .digest("hex");

            const returnData = {
                success: true,
                detail: "worker response recieved successfully",
                data: JSON.parse(response),
            };

            redis.set(key, JSON.stringify(returnData));

            res.send(returnData);
        } catch (error) {
            res.status(500).send({
                success: false,
                detail: "failed to get a response from worker",
            });
        }
    }
);

export default runCodeRouter;
