<<<<<<< HEAD
import Redis from 'ioredis';
import { redisConfig } from './redis.config';

const url = redisConfig.url ?? 'redis://127.0.0.1:6379';

export const redis = new Redis(url, redisConfig.options);
=======
import Redis from "ioredis";
import { env } from "./env";
import { redisConfig } from "./redis.config";

const redisUrl = env.REDIS_URL ?? redisConfig.url ?? "redis://localhost:6379";
export const redis = new Redis(redisUrl, redisConfig.options);
>>>>>>> 65c470c (fix(testing): stabilize integration setup and unit test execution)
