import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { connect, Channel } from "amqplib";
import { validateRequest } from "zod-express-middleware";

import { fetchProblem } from "../../core/helpers/problems";
import { TestCodeJobValidator } from "../../core/models/types";

const QUEUE_NAME = "test_code";

const connectionData: {
    channel: Channel | null;
} = { channel: null };

async function getConnection() {
    if (!connectionData.channel) {
        const connection = await connect("amqp://localhost");
        const channel = await connection.createChannel();

        await channel.assertQueue(QUEUE_NAME, { durable: false });

        connectionData.channel = channel;
    }

    return connectionData.channel;
}
const testCodeRouter = Router();

testCodeRouter.post(
    "/testcode",
    validateRequest({ body: TestCodeJobValidator }),
    async (req, res) => {
        const channel = await getConnection();
        const jobID = uuidv4();

        let data;
        try {
            data = await fetchProblem(req.body.problem_id);
        } catch {
            return res.status(404).send({
                success: true,
                detail: "failed to find problem with given id",
            });
        }

        let msg = JSON.stringify({
            jobID: jobID,
            code: req.body.code,
            data: JSON.stringify(data),
            replyBack: true,
        });
        channel.sendToQueue(QUEUE_NAME, Buffer.from(msg), { persistent: true });

        res.send({
            success: true,
            detail: "job has been added to the queue",
            jobID: jobID,
        });
    }
);

export default testCodeRouter;
