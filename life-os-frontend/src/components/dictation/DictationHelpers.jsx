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
 * Phân tích chi tiết từng ký tự sai giữa hai từ
 */
export const diffCharacters = (got, expected) => {
  if (!got) got = '';
  if (!expected) expected = '';

  const m = got.length;
  const n = expected.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (got[i - 1] === expected[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],    // Xóa (Deletion - thừa ở got)
          dp[i][j - 1],    // Thêm (Insertion - thiếu ở got)
          dp[i - 1][j - 1] // Thay (Substitution - sai khác)
        );
      }
    }
  }

  let i = m, j = n;
  const diffs = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && got[i - 1] === expected[j - 1]) {
      diffs.unshift({ char: expected[j - 1], type: 'correct' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j] === dp[i][j - 1] + 1)) {
      // Thiếu ký tự này
      diffs.unshift({ char: expected[j - 1], type: 'missing' });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j] === dp[i - 1][j] + 1)) {
      // Dư ký tự này (người dùng nói thừa)
      diffs.unshift({ char: got[i - 1], type: 'extra' });
      i--;
    } else if (i > 0 && j > 0) {
      // Sai ký tự này
      diffs.unshift({ char: expected[j - 1], type: 'wrong', gotChar: got[i - 1] });
      i--; j--;
    }
  }
  return diffs;
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
        type: !userWords[i] ? 'missing' : !correctWords[i] ? 'extra' : 'wrong',
        charDiffs: diffCharacters(userWords[i] || '', correctWords[i] || '')
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
  let bgColor, textColor, borderColor, icon, label;

  if (accuracy >= 95) {
    bgColor = 'bg-emerald-50/80';
    textColor = 'text-emerald-700';
    borderColor = 'border-emerald-200';
    icon = '🏆';
    label = 'Xuất sắc!';
  } else if (accuracy >= 85) {
    bgColor = 'bg-indigo-50/80';
    textColor = 'text-indigo-700';
    borderColor = 'border-indigo-200';
    icon = '🌟';
    label = 'Rất tốt!';
  } else if (accuracy >= 70) {
    bgColor = 'bg-amber-50/80';
    textColor = 'text-amber-700';
    borderColor = 'border-amber-200';
    icon = '👍';
    label = 'Tốt!';
  } else if (accuracy >= 50) {
    bgColor = 'bg-orange-50/80';
    textColor = 'text-orange-700';
    borderColor = 'border-orange-200';
    icon = '💪';
    label = 'Cần cải thiện';
  } else {
    bgColor = 'bg-rose-50/80';
    textColor = 'text-rose-700';
    borderColor = 'border-rose-200';
    icon = '📚';
    label = 'Cần luyện tập thêm';
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgColor} border ${borderColor} shadow-sm backdrop-blur-sm`}>
      <span className="text-xl drop-shadow-sm">{icon}</span>
      <span className={`font-black tracking-wide ${textColor}`}>
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