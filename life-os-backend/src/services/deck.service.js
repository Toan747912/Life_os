const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createDeck = async (userId, data) => {
    return await prisma.deck.create({
        data: {
            userId,
            title: data.title,
            description: data.description,
            isPublic: data.isPublic || false
        }
    });
};

const getUserDecks = async (userId) => {
    return await prisma.deck.findMany({
        where: { userId },
        include: {
            _count: { select: { items: true } }
        },
        orderBy: { updatedAt: 'desc' }
    });
};

const getDeckById = async (userId, deckId) => {
    return await prisma.deck.findFirst({
        where: { id: deckId, userId },
        include: {
            items: true
        }
    });
};

const updateDeck = async (userId, deckId, data) => {
    const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
    if (!deck) throw new Error("Deck not found");

    return await prisma.deck.update({
        where: { id: deckId },
        data: {
            title: data.title,
            description: data.description,
            isPublic: data.isPublic
        }
    });
};

const deleteDeck = async (userId, deckId) => {
    const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
    if (!deck) throw new Error("Deck not found");

    return await prisma.deck.delete({
        where: { id: deckId }
    });
};

const addItemsToDeck = async (userId, deckId, itemIds) => {
    const deck = await prisma.deck.findFirst({ where: { id: deckId, userId } });
    if (!deck) throw new Error("Deck not found");

    // Chỉ update các item thuộc về userId này
    return await prisma.learningItem.updateMany({
        where: {
            id: { in: itemIds },
            userId: userId
        },
        data: {
            deckId: deckId
        }
    });
};

const removeItemsFromDeck = async (userId, deckId, itemIds) => {
    return await prisma.learningItem.updateMany({
        where: {
            id: { in: itemIds },
            userId: userId,
            deckId: deckId
        },
        data: {
            deckId: null
        }
    });
};

module.exports = {
    createDeck,
    getUserDecks,
    getDeckById,
    updateDeck,
    deleteDeck,
    addItemsToDeck,
    removeItemsFromDeck
};
