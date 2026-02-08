
const RedisServer = require('redis-server');
const logger = require('../src/utils/logger-bridge.cjs');
 
// Simply pass the port that you want a Redis server to listen on.
const server = new RedisServer(6379);
 
server.open((err) => {
  if (err === null) {
    // You may now connect a client to the Redis
    // server bound to port 6379.
    logger.log('Redis Server Started on 6379!');
  } else {
    logger.error('Error opening redis server', err);
  }
});
