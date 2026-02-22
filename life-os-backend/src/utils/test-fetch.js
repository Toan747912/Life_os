const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFetch() {
    const userId = '1b0eca16-b3d4-4f81-9f22-3860538a8f5b'; // From debug script
    const today = new Date();

    const items = await prisma.userProgress.findMany({
        where: {
            userId,
            nextReviewDate: { lte: today }
        }
    });

    console.log("Found items for user:", items.length);
    process.exit(0);
}

testFetch().catch(err => {
    console.error(err);
    process.exit(1);
});
