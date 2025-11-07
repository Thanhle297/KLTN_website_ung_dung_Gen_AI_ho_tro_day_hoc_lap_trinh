import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import "../styles/CodeEditorSimple.scss";

export default function CodeEditorSimple({
  code,
  input,
  question,
  onChangeCode,
  onChangeInput,
  onChangeResult,
  onExecuteResponse,
  difficulty,
}) {
  const [localCode, setLocalCode] = useState(code || "");
  const [inputText, setInputText] = useState(input || "");
  const [output, setOutput] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal");
  const [hasNewGuide, setHasNewGuide] = useState(false);

  // Reset mỗi khi đổi câu
  useEffect(() => {
    setLocalCode(code || "");
    setInputText(input || "");
    setOutput("");
    setGuide("");
    setActiveTab("terminal");
    setHasNewGuide(false);
  }, [code, input, question?.id]);

  const runCode = async () => {
    setLoading(true);
    setOutput("⏳ Đang chạy code...\n");
    setGuide("");
    setHasNewGuide(false);

    try {
      // 🔹 Gọi Python backend để chạy code
      const resp = await fetch(
        `${process.env.REACT_APP_API_URL_B}/run_code_simple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: localCode, input: inputText }),
        }
      );
      const data = await resp.json();

      const isSuccess = !!data.success;
      const resultOutput = data.output || data.error || "Không có output";

      setOutput(resultOutput);
      onChangeResult?.(resultOutput);

      // 🔹 Gọi AI LUÔN LUÔN, gửi kèm đề bài (question)
      const aiResp = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ai/simple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: localCode,
            question:
              question?.question || // ✅ đây là nội dung đề thật
              question?.description ||
              question?.title ||
              "Không có đề bài",
            input: inputText,
            output: resultOutput,
            difficulty,
          }),
        }
      );

      const aiData = await aiResp.json();
      const guideText = aiData.guide || aiData.raw || "AI không phản hồi.";
      setGuide(guideText);
      setHasNewGuide(true);

      // 🔹 Truyền kết quả + hướng dẫn cho LayoutSimple
      // Trong phần onExecuteResponse
      onExecuteResponse?.({
        success: isSuccess,
        instructs: guideText.split("\n").filter((s) => s.trim() !== ""),
        simpleStatus: /đáp ứng đầy đủ yêu cầu/i.test(guideText)
          ? "correct"
          : "wrong",
        questionId: question.id,
      });
    } catch (err) {
      setOutput(`❌ Lỗi kết nối tới Python service: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-editor">
      <CodeMirror
        value={localCode}
        height="400px"
        extensions={[python(), autocompletion({ override: [] })]}
        onChange={(value) => {
          setLocalCode(value);
          onChangeCode?.(value);
        }}
      />

      <textarea
        placeholder="Nhập input tại đây..."
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          onChangeInput?.(e.target.value);
        }}
        className="code-editor__input"
      />

      <button
        className="code-editor__run-btn"
        onClick={runCode}
        disabled={loading}
      >
        {loading ? <ImSpinner2 className="spinner" /> : "Chạy code"}
      </button>

      <div className="code-editor__tabs">
        <div className="tabs-header">
          <button
            className={activeTab === "terminal" ? "active" : ""}
            onClick={() => setActiveTab("terminal")}
          >
            Terminal
          </button>

          <button
            className={`${activeTab === "guide" ? "active" : ""} ${
              hasNewGuide ? "blink-red" : ""
            }`}
            onClick={() => {
              setActiveTab("guide");
              setHasNewGuide(false);
            }}
          >
            Gợi ý AI
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "terminal" && (
            <div className="terminal-output">
              {output || "Chưa có kết quả."}
            </div>
          )}
          {activeTab === "guide" && (
            <div className="ai-guide">{guide || "Chưa có gợi ý từ AI."}</div>
          )}
        </div>
      </div>
    </div>
  );
}
