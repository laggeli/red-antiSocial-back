const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
});

redisClient.on('error', (err) => {
  console.error('Error en la conexión con Redis:', err);
});

const conectarRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log('Conectado a Redis exitosamente');
  }
};

module.exports = {
  redisClient,
  conectarRedis,
};