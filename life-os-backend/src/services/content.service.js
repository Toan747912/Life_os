const pdf = require('pdf-parse');
const { YoutubeTranscript } = require('youtube-transcript');
const cheerio = require('cheerio');
const axios = require('axios');

const extractContent = async (type, data) => {
  try {
    switch (type) {
      case 'YOUTUBE':
        // data là URL video
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(data);
          return transcript.map(i => `[${Math.floor(i.offset / 1000)}s] ${i.text}`).join(' ');
        } catch (ytError) {
          console.error(`[YOUTUBE_ERR] Lỗi khi lấy CC:`, ytError.message);
          throw new Error("Video này không có phụ đề (CC) hoặc YouTube không cho phép trích xuất. Hãy chọn video khác có phụ đề, hoặc tải video về máy và dùng tính năng Upload Video.");
        }

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