import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const redis = createClient({ url: process.env.REDIS_URL });
redis.connect();

const prisma = new PrismaClient();

export { redis, prisma };
