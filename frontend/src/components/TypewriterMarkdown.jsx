// components/TypewriterMarkdown.jsx
// Component render markdown với hiệu ứng chạy chữ mượt theo từng ký tự
import React, { useEffect } from "react";
import AIMarkdown from "./AIMarkdown";
import useTypewriter from "../hook/useTypewriter";

/**
 * Render nội dung markdown với hiệu ứng chạy chữ mượt.
 * Khi chạy xong, gọi onComplete callback.
 *
 * @param {string} content - Chuỗi markdown cần render
 * @param {number} [speed=30] - Delay giữa mỗi ký tự (ms). Nhỏ hơn = nhanh hơn.
 * @param {Function} [onComplete] - Callback khi chạy xong
 * @param {string} [emptyText] - Text hiển thị khi content rỗng
 * @param {string} [className] - CSS class bổ sung
 */
const TypewriterMarkdown = React.memo(function TypewriterMarkdown({
  content,
  speed = 30,
  onComplete,
  emptyText = "Không có hướng dẫn.",
  className = "",
}) {
  const { displayedText, isComplete, skip } = useTypewriter(content, {
    speed,
    enabled: true,
  });

  // Gọi onComplete khi chạy xong
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete();
    }
  }, [isComplete, onComplete]);

  if (!content) {
    return <p className="ai-markdown__empty">{emptyText}</p>;
  }

  return (
    <div className={`typewriter-markdown ${className}`}>
      <div className="typewriter-markdown__content">
        <AIMarkdown content={displayedText} emptyText={emptyText} />
        {!isComplete && <span className="typewriter-cursor">▌</span>}
      </div>
      {!isComplete && (
        <button
          type="button"
          className="typewriter-skip-btn"
          onClick={skip}
          title="Hiện toàn bộ nội dung"
          aria-label="Bỏ qua hiệu ứng chạy chữ"
        >
          Bỏ qua ⏩
        </button>
      )}
    </div>
  );
});

export default TypewriterMarkdown;
