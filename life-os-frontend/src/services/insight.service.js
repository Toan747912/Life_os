import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL + '/insights';

const getInsights = async (params = {}) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
    return response.data;
};

const createInsight = async (data) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const updateInsight = async (id, data) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const deleteInsight = async (id) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export default {
    getInsights,
    createInsight,
    updateInsight,
    deleteInsight
};
