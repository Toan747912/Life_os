import React, { useRef, useState, useEffect } from 'react';

const HandwritingPad = ({ onRecognized, expectedAnswer = '' }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const timeoutRef = useRef(null);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Nền trắng
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Vẽ các ô hướng dẫn cho từng chữ cái
    const numChars = expectedAnswer.length > 0 ? expectedAnswer.length : 10; // Mặc định 10 ô nếu không có text
    const boxWidth = canvas.width / numChars;

    ctx.strokeStyle = '#F0F0F0'; // Màu xám nhạt
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Nét đứt

    for (let i = 1; i < numChars; i++) {
      ctx.beginPath();
      ctx.moveTo(i * boxWidth, 0);
      ctx.lineTo(i * boxWidth, canvas.height);
      ctx.stroke();
    }

    // Reset lại style cho nét bút của người dùng
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'black';
  };

  // Cấu hình bảng vẽ khi component mount hoặc expectedAnswer thay đổi
  useEffect(() => {
    setupCanvas();
  }, [expectedAnswer]);

  // --- CƠ CHẾ VẼ (DRAWING LOGIC) ---
  const startDrawing = ({ nativeEvent }) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    // Đảm bảo nét bút đúng màu sau khi vẽ ô
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);

    // Auto-trigger REMOVED to prevent Rate Limiting (Quota exceeded)
    // timeoutRef.current = setTimeout(() => {
    //   recognizeHandwriting();
    // }, 1500);
  };

  const getCoordinates = (event) => {
    if (event.touches && event.touches[0]) {
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        offsetX: event.touches[0].clientX - rect.left,
        offsetY: event.touches[0].clientY - rect.top
      };
    }
    return { offsetX: event.offsetX, offsetY: event.offsetY };
  };

  // --- CƠ CHẾ AI NHẬN DIỆN (GEMINI) ---
  const recognizeHandwriting = async () => {
    setRecognizing(true);
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');

    try {
      const response = await fetch('http://localhost:8080/api/recognize-handwriting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error + (errorData.details ? ` (${errorData.details})` : '') || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const cleanText = data.text ? data.text.trim().replace(/\n/g, "") : "";

      console.log("Gemini AI Đọc được:", cleanText);

      if (onRecognized) onRecognized(cleanText);

    } catch (err) {
      console.error("Lỗi nhận diện (Gemini):", err.message);
      // Hiển thị lỗi cho người dùng nếu cần
      if (onRecognized) onRecognized(`Lỗi: ${err.message}`);
    } finally {
      setRecognizing(false);
    }
  };

  // Khi xóa, vẽ lại cả các ô hướng dẫn
  const clearCanvas = () => {
    setupCanvas();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative border-2 border-dashed border-gray-400 rounded-xl overflow-hidden shadow-lg cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          style={{ touchAction: 'none' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {recognizing && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <span className="text-indigo-600 font-bold animate-pulse">🤖 AI Đang đọc...</span>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
        >
          Xóa, viết lại
        </button>
        <button
          onClick={recognizeHandwriting}
          disabled={recognizing}
          className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:opacity-50"
        >
          {recognizing ? 'Đang đọc...' : '✅ Chấm điểm / Đọc chữ'}
        </button>
      </div>
    </div>
  );
};

export default HandwritingPad;
