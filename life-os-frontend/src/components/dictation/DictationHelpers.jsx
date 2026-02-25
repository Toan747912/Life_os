/**
 * Thuật toán Levenshtein Distance để so sánh hai chuỗi
 * @param {string} str1 - Chuỗi người dùng nhập
 * @param {string} str2 - Chuỗi chuẩn
 * @returns {object} - Kết quả so sánh
 */
export const calculateLevenshtein = (str1, str2) => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  const m = s1.length;
  const n = s2.length;
  
  // Tạo ma trận DP
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // Khởi tạo hàng đầu tiên
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  
  // Khởi tạo cột đầu tiên
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Điền ma trận
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Xóa
          dp[i][j - 1],    // Thêm
          dp[i - 1][j - 1] // Thay thế
        );
      }
    }
  }
  
  const distance = dp[m][n];
  const maxLength = Math.max(m, n);
  const accuracy = maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;
  const score = Math.round(accuracy);
  
  return {
    score,
    accuracy: Math.round(accuracy * 100) / 100,
    distance,
    isPerfect: distance === 0
  };
};

/**
 * Phân tích chi tiết các từ sai
 * @param {string} userAnswer - Câu trả lời của người dùng
 * @param {string} correctAnswer - Câu chuẩn
 * @returns {array} - Danh sách các từ sai
 */
export const analyzeWrongWords = (userAnswer, correctAnswer) => {
  const userWords = userAnswer.toLowerCase().trim().split(/\s+/);
  const correctWords = correctAnswer.toLowerCase().trim().split(/\s+/);
  
  const wrongWords = [];
  const maxLength = Math.max(userWords.length, correctWords.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (userWords[i] !== correctWords[i]) {
      wrongWords.push({
        index: i + 1,
        expected: correctWords[i] || '(thiếu)',
        got: userWords[i] || '(thừa)',
        type: !userWords[i] ? 'missing' : !correctWords[i] ? 'extra' : 'wrong'
      });
    }
  }
  
  return wrongWords;
};

/**
 * Component Badge hiển thị độ chính xác
 * @param {number} accuracy - Độ chính xác (0-100)
 * @returns {JSX} - Badge component
 */
export const getAccuracyBadge = (accuracy) => {
  let bgColor, textColor, icon, label;
  
  if (accuracy >= 95) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
    icon = '🏆';
    label = 'Xuất sắc!';
  } else if (accuracy >= 85) {
    bgColor = 'bg-blue-100';
    textColor = 'text-blue-700';
    icon = '🌟';
    label = 'Rất tốt!';
  } else if (accuracy >= 70) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-700';
    icon = '👍';
    label = 'Tốt!';
  } else if (accuracy >= 50) {
    bgColor = 'bg-orange-100';
    textColor = 'text-orange-700';
    icon = '💪';
    label = 'Cần cải thiện';
  } else {
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
    icon = '📚';
    label = 'Cần luyện tập thêm';
  }
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgColor}`}>
      <span className="text-xl">{icon}</span>
      <span className={`font-semibold ${textColor}`}>
        {label} ({accuracy.toFixed(1)}%)
      </span>
    </div>
  );
};

/**
 * Format thời gian từ giây sang mm:ss
 * @param {number} seconds - Thời gian tính bằng giây
 * @returns {string} - Chuỗi thời gian định dạng
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Lấy gợi ý cho từ/cụm từ
 * @param {string} text - Text gốc
 * @param {number} showLength - Số ký tự hiển thị
 * @returns {string} - Chuỗi gợi ý
 */
export const getHint = (text, showLength = 2) => {
  if (!text || text.length <= showLength) {
    return text;
  }
  return text.substring(0, showLength) + '...';
};

/**
 * Validate input
 * @param {string} input - Input cần validate
 * @returns {object} - Kết quả validation
 */
export const validateInput = (input) => {
  const errors = [];
  
  if (!input || input.trim().length === 0) {
    errors.push('Vui lòng nhập nội dung');
  }
  
  if (input && input.length > 5000) {
    errors.push('Nội dung quá dài (tối đa 5000 ký tự)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};