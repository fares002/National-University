import redis from './redis'

async function quickTest() {
    try {
        console.log('🧪 Testing Redis without password...');
        
        // اختبار PING
        const ping = await redis.ping();
        console.log('✅ PING:', ping);
        
        // اختبار الكتابة
        await redis.set('hello', 'world');
        console.log('✅ Write successful');
        
        // اختبار القراءة
        const value = await redis.get('hello');
        console.log('✅ Read:', value);
        
        // اختبار TTL
        await redis.setex('temp', 5, 'expires soon');
        const ttl = await redis.ttl('temp');
        console.log('✅ TTL test:', ttl, 'seconds');
        
        // تنظيف
        await redis.del('hello', 'temp');
        console.log('✅ Cleanup done');
        
        console.log('🎉 All tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error)
    }
}

quickTest();