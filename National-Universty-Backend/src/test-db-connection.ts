// Database connectivity test script
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query execution successful:", result);

    // Test table existence
    const userCount = await prisma.user.count();
    console.log(`✅ User table accessible. Current count: ${userCount}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("📝 Connection closed");
  }
}

testConnection();
