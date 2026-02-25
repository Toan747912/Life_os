const authService = require('../services/auth.service');

const register = async (req, res) => {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
        }

        const newUser = await authService.register(email, password, fullName);
        res.status(201).json({ message: 'Đăng ký thành công', data: newUser });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc.' });
        }

        const result = await authService.login(email, password);
        res.json({ message: 'Đăng nhập thành công', ...result });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    register,
    login
};
