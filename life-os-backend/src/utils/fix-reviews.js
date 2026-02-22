const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixReviewDates() {
    console.log("🛠️  Đang cập nhật lại ngày ôn tập cho các từ vựng...");

    const now = new Date();

    const result = await prisma.userProgress.updateMany({
        data: {
            nextReviewDate: now
        }
    });

    console.log(`✅ Thành công! Đã cập nhật ${result.count} mục ôn tập.`);
    process.exit(0);
}

fixReviewDates().catch(err => {
    console.error(err);
    process.exit(1);
});
