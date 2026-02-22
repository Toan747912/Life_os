const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const userId = '1b0eca16-b3d4-4d27-b172-c59c54984ce3';
    const newPrefs = { defaultAiModel: 'gemini-1.5-pro', someOtherSetting: true };

    console.log("Updating preferences for:", userId);
    try {
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { preferences: newPrefs }
        });
        console.log("Successfully updated:", updated.preferences);

        const fetched = await prisma.user.findUnique({ where: { id: userId } });
        console.log("Verified in DB:", fetched.preferences);
    } catch (error) {
        console.error("Update failed:", error.message);
    }
    process.exit(0);
}

testUpdate().catch(err => {
    console.error(err);
    process.exit(1);
});
