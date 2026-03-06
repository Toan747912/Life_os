const deckService = require('../services/deck.service');

const createDeck = async (req, res) => {
    try {
        const deck = await deckService.createDeck(req.user.id, req.body);
        res.status(201).json({ message: "Tạo bộ thẻ thành công", data: deck });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserDecks = async (req, res) => {
    try {
        const decks = await deckService.getUserDecks(req.user.id);
        res.json({ message: "Lấy danh sách bộ thẻ thành công", data: decks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getDeckById = async (req, res) => {
    try {
        const deck = await deckService.getDeckById(req.user.id, req.params.id);
        if (!deck) return res.status(404).json({ error: "Không tìm thấy bộ thẻ" });
        res.json({ message: "Thành công", data: deck });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateDeck = async (req, res) => {
    try {
        const updated = await deckService.updateDeck(req.user.id, req.params.id, req.body);
        res.json({ message: "Cập nhật thành công", data: updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteDeck = async (req, res) => {
    try {
        await deckService.deleteDeck(req.user.id, req.params.id);
        res.json({ message: "Xóa thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const addItemsToDeck = async (req, res) => {
    try {
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds)) return res.status(400).json({ error: "itemIds phải là mảng" });
        await deckService.addItemsToDeck(req.user.id, req.params.id, itemIds);
        res.json({ message: "Đã thêm từ vựng vào bộ thẻ" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const removeItemsFromDeck = async (req, res) => {
    try {
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds)) return res.status(400).json({ error: "itemIds phải là mảng" });
        await deckService.removeItemsFromDeck(req.user.id, req.params.id, itemIds);
        res.json({ message: "Đã xóa từ vựng khỏi bộ thẻ" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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
