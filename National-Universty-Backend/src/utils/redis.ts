import { Redis } from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect:true,
    connectTimeout: 10000,         
    commandTimeout: 5000,           
    maxRetriesPerRequest: 3,      
    keepAlive: 30000,            
    enableReadyCheck: true,       
    enableOfflineQueue: false,      
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production', 

});




redis.on('connect', () => {
console.log('✅ Redis connected successfully');
});
redis.on('error', (err) => {
console.error('❌ Redis connection error:', err);
});
redis.on('ready', () => {
console.log('🚀 Redis is ready to accept commands');
});

export default redis;