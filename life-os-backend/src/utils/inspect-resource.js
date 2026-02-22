const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectResource() {
    const resource = await prisma.resource.findFirst({
        include: { learningItems: true }
    });

    if (resource) {
        console.log("Resource Title:", resource.title);
        console.log("AI Metadata:", JSON.stringify(resource.aiMetadata, null, 2));
        console.log("Learning Items Count:", resource.learningItems.length);
        console.log("Raw Content Snippet:", resource.rawContent?.slice(0, 100));
    } else {
        console.log("No resource found.");
    }

    process.exit(0);
}

inspectResource().catch(err => {
    console.error(err);
    process.exit(1);
});
