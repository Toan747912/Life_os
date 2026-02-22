const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectLastResources() {
    const resources = await prisma.resource.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { learningItems: true }
    });

    if (resources.length > 0) {
        resources.forEach((res, i) => {
            console.log(`--- [${i + 1}] ${res.title} ---`);
            console.log("ID:", res.id);
            console.log("Items Count:", res.learningItems.length);
            console.log("AI Summary:", res.aiMetadata?.summary);
            console.log("Vocab mapping from Metadata (First 2):", (res.aiMetadata?.vocabularyList || []).slice(0, 2));
        });
    } else {
        console.log("No resources found.");
    }

    process.exit(0);
}

inspectLastResources().catch(err => {
    console.error(err);
    process.exit(1);
});
