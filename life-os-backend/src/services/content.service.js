const pdf = require('pdf-parse');
const { YoutubeTranscript } = require('youtube-transcript');
const cheerio = require('cheerio');
const axios = require('axios');

const extractContent = async (type, data) => {
  try {
    switch (type) {
      case 'YOUTUBE':
        // data là URL video
        const transcript = await YoutubeTranscript.fetchTranscript(data);
        return transcript.map(i => `[${Math.floor(i.offset / 1000)}s] ${i.text}`).join(' ');

      case 'PDF':
        // data là Buffer của file upload
        const pdfData = await pdf(data);
        return pdfData.text;

      case 'WEBSITE':
        // data là URL trang web
        const { data: html } = await axios.get(data);
        const $ = cheerio.load(html);
        // Lấy text từ thẻ p (văn bản chính)
        return $('p').text();

      case 'TEXT':
      default:
        return data;
    }
  } catch (error) {
    console.error(`Lỗi trích xuất ${type}:`, error);
    throw new Error("Không thể đọc nội dung từ nguồn này.");
  }
};

module.exports = { extractContent };