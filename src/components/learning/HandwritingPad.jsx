import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

const HandwritingPad = ({ onRecognized }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const timeoutRef = useRef(null);
  
  // Cấu hình bảng vẽ
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Thiết lập nét bút
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    // Làm trắng nền (Tesseract đọc nền trắng chữ đen tốt nhất)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // --- CƠ CHẾ VẼ (DRAWING LOGIC) ---
  const startDrawing = ({ nativeEvent }) => {
    // Nếu người dùng vẽ tiếp, hủy lệnh nhận diện đang chờ
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    const ctx = canvasRef.current.getContext('2d');
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

    // --- CƠ CHẾ "THẢ TAY RA" ---
    // Đợi 1.5 giây. Nếu không vẽ thêm gì, bắt đầu nhận diện.
    timeoutRef.current = setTimeout(() => {
      recognizeHandwriting();
    }, 1500);
  };

  // Helper: Lấy tọa độ chuột/cảm ứng chính xác
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

  // --- CƠ CHẾ AI NHẬN DIỆN (OCR) ---
  const recognizeHandwriting = async () => {
    setRecognizing(true);
    const canvas = canvasRef.current;
    
    // 1. Chuyển hình vẽ thành ảnh
    const image = canvas.toDataURL('image/png');

    try {
      // 2. Gửi cho Tesseract
      const { data: { text } } = await Tesseract.recognize(image, 'eng', {
        // Chỉ nhận diện ký tự chữ cái (whitelist) để tăng độ chính xác
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ',
      });

      const cleanText = text.trim().replace(/\n/g, "");
      console.log("AI Đọc được:", cleanText);
      
      // 3. Trả kết quả về App cha
      if (onRecognized) onRecognized(cleanText);
      
      // (Tùy chọn) Xóa bảng sau khi nhận diện xong để viết từ mới
      // clearCanvas(); 

    } catch (err) {
      console.error("Lỗi nhận diện:", err);
    } finally {
      setRecognizing(false);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative border-2 border-dashed border-gray-400 rounded-xl overflow-hidden shadow-lg cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          // Hỗ trợ cảm ứng (Mobile/Tablet)
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

      <div className="flex gap-2">
        <button onClick={clearCanvas} className="text-xs text-red-500 underline">Xóa, viết lại</button>
      </div>
    </div>
  );
};

export default HandwritingPad;
