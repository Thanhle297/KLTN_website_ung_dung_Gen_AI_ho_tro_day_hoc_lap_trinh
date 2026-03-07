// components/AIMarkdown.jsx
// Component render markdown từ AI response với syntax highlighting
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/atom-one-dark.css";
import "../styles/AIMarkdown.scss";

/**
 * Render nội dung markdown từ AI (guide, hướng dẫn, gợi ý).
 * Tự động highlight code block, render bảng, bold, italic, list.
 *
 * @param {string} content - Chuỗi markdown cần render
 * @param {string} [className] - CSS class bổ sung
 * @param {string} [emptyText] - Text hiển thị khi content rỗng
 */
const AIMarkdown = React.memo(function AIMarkdown({
  content,
  className = "",
  emptyText = "Chưa có nội dung.",
}) {
  if (!content) {
    return <p className="ai-markdown__empty">{emptyText}</p>;
  }

  return (
    <div className={`ai-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Code block (v8): phân biệt inline vs block qua prop `inline`
          code({ node, inline, className: codeClass, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClass || "");
            const codeText = String(children).replace(/\n$/, "");

            if (!inline && match) {
              return (
                <div className="ai-markdown__code-block">
                  <div className="ai-markdown__code-header">
                    <span className="ai-markdown__lang">{match[1]}</span>
                    <button
                      type="button"
                      className="ai-markdown__copy-btn"
                      onClick={() => navigator.clipboard.writeText(codeText)}
                      title="Sao chép code"
                    >
                      Sao chép
                    </button>
                  </div>
                  <code className={codeClass} {...props}>
                    {children}
                  </code>
                </div>
              );
            }

            // Inline code hoặc block không có ngôn ngữ
            return (
              <code className="ai-markdown__inline-code" {...props}>
                {children}
              </code>
            );
          },
          // Mở link ở tab mới
          a({ href, children, ...props }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

export default AIMarkdown;
