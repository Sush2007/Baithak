import { Redis } from '@upstash/redis';

const REDIS_QUEUE_KEY = 'baithak_async_write_queue';

let redis;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch (error) {
  console.warn('Failed to initialize Redis for queue:', error);
}

/**
 * Pushes a generic event payload to the Redis buffer queue.
 * @param {string} eventType - e.g., 'PAGE_VIEW', 'ACTIVITY_LOG', 'ANALYTICS'
 * @param {object} payload - Data to save
 */
export async function enqueueTask(eventType, payload) {
  if (!redis) {
    console.warn('Redis not configured, skipping enqueueTask.');
    return false;
  }

  const task = {
    id: crypto.randomUUID(),
    eventType,
    payload,
    timestamp: new Date().toISOString(),
  };

  try {
    // LPUSH adds the task to the head of the list (queue)
    await redis.lpush(REDIS_QUEUE_KEY, JSON.stringify(task));
    return task.id;
  } catch (error) {
    console.error('Error enqueueing task to Redis:', error);
    return false;
  }
}

/**
 * Pops up to `batchSize` tasks from the queue for processing.
 * @param {number} batchSize 
 */
export async function dequeueTasks(batchSize = 50) {
  if (!redis) return [];

  const tasks = [];
  try {
    // We use RPOP to remove and get the last element (FIFO)
    for (let i = 0; i < batchSize; i++) {
      const taskStr = await redis.rpop(REDIS_QUEUE_KEY);
      if (!taskStr) break; // Queue is empty
      tasks.push(taskStr); // Upstash Redis parses JSON automatically if it detects it, but we stringified it.
    }
  } catch (error) {
    console.error('Error dequeueing tasks from Redis:', error);
  }
  
  return tasks;
}
