const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    const users = await prisma.user.findMany();
    console.log("Users:", users.map(u => ({ id: u.id, email: u.email })));

    const resourceCount = await prisma.resource.count();
    console.log("Total resources:", resourceCount);

    const progressCount = await prisma.userProgress.count();
    console.log("Total progress items:", progressCount);

    const pendingReviews = await prisma.userProgress.findMany({
        include: { item: true }
    });
    console.log("Details (first 5):", pendingReviews.slice(0, 5).map(p => ({
        id: p.id,
        userId: p.userId,
        term: p.item.term,
        nextReviewDate: p.nextReviewDate
    })));

    process.exit(0);
}

checkData().catch(err => {
    console.error(err);
    process.exit(1);
});
