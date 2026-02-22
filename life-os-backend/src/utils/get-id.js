const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getFullId() {
    const users = await prisma.user.findMany();
    if (users.length > 0) {
        console.log("ACTUAL_DB_USER_ID=" + users[0].id);
    } else {
        console.log("NO_USER_FOUND");
    }
    process.exit(0);
}

getFullId().catch(err => {
    console.error(err);
    process.exit(1);
});
