// hook/useTypewriter.js
// Custom hook hiệu ứng chạy chữ mượt bằng requestAnimationFrame
// Chạy theo ký tự, tốc độ nhanh, pause tự nhiên ở cuối câu và code block
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Tìm vị trí kết thúc code block bắt đầu tại pos.
 * Trả về index ngay sau ``` đóng, hoặc -1 nếu không tìm thấy.
 */
function findCodeBlockEnd(text, pos) {
  const closeIdx = text.indexOf("```", pos + 3);
  return closeIdx !== -1 ? closeIdx + 3 : -1;
}

/**
 * Tìm vị trí kết thúc inline code bắt đầu tại pos.
 * Trả về index ngay sau ` đóng, hoặc -1 nếu không tìm thấy.
 */
function findInlineCodeEnd(text, pos) {
  const closeIdx = text.indexOf("`", pos + 1);
  return closeIdx !== -1 ? closeIdx + 1 : -1;
}

/**
 * Xác định số ký tự cần nhảy và thời gian pause tại vị trí hiện tại.
 * Trả về { jump, pauseMs }
 *   - jump: số ký tự hiện ngay lập tức (>1 cho code block, inline code)
 *   - pauseMs: thời gian nghỉ sau khi hiện xong nhóm ký tự này
 */
function getStepAt(text, pos, charDelay) {
  // Code block: hiện nguyên cả block
  if (text.startsWith("```", pos)) {
    const end = findCodeBlockEnd(text, pos);
    if (end !== -1) {
      return { jump: end - pos, pauseMs: 400 };
    }
  }

  // Inline code: hiện nguyên cụm
  if (text[pos] === "`" && !text.startsWith("```", pos)) {
    const end = findInlineCodeEnd(text, pos);
    if (end !== -1) {
      return { jump: end - pos, pauseMs: charDelay };
    }
  }

  const ch = text[pos];

  // Cuối câu: pause lâu hơn
  if (ch === "." || ch === "!" || ch === "?") {
    // Kiểm tra ký tự tiếp là space/newline (thực sự cuối câu)
    const next = text[pos + 1];
    if (!next || next === " " || next === "\n") {
      return { jump: 1, pauseMs: charDelay * 6 };
    }
  }

  // Dấu phẩy, chấm phẩy: pause nhẹ
  if (ch === "," || ch === ";") {
    return { jump: 1, pauseMs: charDelay * 3 };
  }

  // Xuống dòng: pause nhẹ
  if (ch === "\n") {
    return { jump: 1, pauseMs: charDelay * 2 };
  }

  // Ký tự thường
  return { jump: 1, pauseMs: charDelay };
}

/**
 * Hook chạy chữ mượt bằng requestAnimationFrame.
 * Thay vì setTimeout từng token, dùng rAF loop kiểm tra thời gian trôi qua
 * để quyết định hiện thêm bao nhiêu ký tự -> không giật, không khựng.
 *
 * @param {string} text - Nội dung markdown gốc
 * @param {Object} [options]
 * @param {number} [options.speed=30] - Delay cơ bản giữa mỗi ký tự (ms). Nhỏ = nhanh.
 * @param {boolean} [options.enabled=true] - Bật/tắt hiệu ứng
 * @returns {{ displayedText: string, isComplete: boolean, skip: Function, reset: Function, progress: number }}
 */
export default function useTypewriter(text, options = {}) {
  const { speed = 30, enabled = true } = options;

  const [charIndex, setCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const pendingPauseRef = useRef(0);
  const posRef = useRef(0);
  const textRef = useRef(text || "");
  const skipRef = useRef(false);

  // Cập nhật text ref và reset khi text thay đổi
  useEffect(() => {
    textRef.current = text || "";
    posRef.current = 0;
    lastTimeRef.current = 0;
    pendingPauseRef.current = 0;
    skipRef.current = false;
    setCharIndex(0);
    setIsComplete(false);
  }, [text]);

  // Animation loop chính
  useEffect(() => {
    if (!enabled || isComplete || !textRef.current.length) return;

    if (skipRef.current) {
      setCharIndex(textRef.current.length);
      setIsComplete(true);
      return;
    }

    const loop = (timestamp) => {
      if (skipRef.current) {
        setCharIndex(textRef.current.length);
        setIsComplete(true);
        return;
      }

      // Khởi tạo thời gian lần đầu
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastTimeRef.current;

      // Chờ hết pause hiện tại
      if (elapsed < pendingPauseRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Đã hết pause, tính bước tiếp theo
      const txt = textRef.current;
      let pos = posRef.current;

      if (pos >= txt.length) {
        setCharIndex(txt.length);
        setIsComplete(true);
        return;
      }

      const step = getStepAt(txt, pos, speed);
      const newPos = Math.min(pos + step.jump, txt.length);

      posRef.current = newPos;
      pendingPauseRef.current = step.pauseMs;
      lastTimeRef.current = timestamp;

      setCharIndex(newPos);

      if (newPos >= txt.length) {
        setIsComplete(true);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, isComplete, speed]);

  // Text hiển thị = substring từ 0 đến charIndex
  const displayedText = textRef.current.slice(0, charIndex);

  // % tiến độ
  const total = textRef.current.length;
  const progress = total ? Math.round((charIndex / total) * 100) : 0;

  // Bỏ qua - hiện hết ngay
  const skip = useCallback(() => {
    skipRef.current = true;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    posRef.current = textRef.current.length;
    setCharIndex(textRef.current.length);
    setIsComplete(true);
  }, []);

  // Reset lại từ đầu
  const reset = useCallback(() => {
    skipRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    posRef.current = 0;
    lastTimeRef.current = 0;
    pendingPauseRef.current = 0;
    setCharIndex(0);
    setIsComplete(false);
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { displayedText, isComplete, skip, reset, progress };
}
