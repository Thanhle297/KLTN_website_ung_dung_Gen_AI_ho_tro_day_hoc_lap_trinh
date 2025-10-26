import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import "../styles/CodeEditorSimple.scss";

export default function CodeEditorSimple({
  code,
  question,
  onChangeCode,
  onChangeResult,
  onExecuteResponse,
  difficulty,
}) {
  const [localCode, setLocalCode] = useState(code || "");
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal");
  const [hasNewGuide, setHasNewGuide] = useState(false); // ✅ nháy đỏ khi có gợi ý mới

  const runCode = async () => {
    setLoading(true);
    setOutput("⏳ Đang chạy code...\n");
    setGuide(""); // reset gợi ý cũ
    setHasNewGuide(false);

    try {
      // ✅ Gọi Python service
      const resp = await fetch("http://localhost:8001/run_code_simple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: localCode, input: inputText }),
      });

      const data = await resp.json();

      if (data.success) {
        // ✅ Code chạy đúng
        setOutput(data.output);
        onChangeResult(data.output);
        return; // ❌ Không gọi AI khi đúng
      } else {
        // ❌ Code lỗi
        setOutput(`❌ ${data.error}`);
        onChangeResult(data.error);

        // ✅ Gọi AI phân tích lỗi
        const aiResp = await fetch("http://localhost:3001/api/ai/simple", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: localCode,
            question: question.title || "",
            input: inputText,
            output: data.error || "Không có output",
            difficulty,
          }),
        });

        const aiData = await aiResp.json();
        const guideText = aiData.guide || aiData.raw || "AI không phản hồi.";

        setGuide(guideText);
        setHasNewGuide(true); // ✅ bật nháy đỏ khi có gợi ý mới
        onExecuteResponse?.(aiData);
      }
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
          onChangeCode(value);
        }}
      />

      <textarea
        placeholder="Nhập input tại đây..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
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
              setHasNewGuide(false); // tắt nháy khi người dùng xem
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
