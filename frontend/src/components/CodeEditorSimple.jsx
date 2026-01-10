// components/CodeEditorSimple.jsx
import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import "../styles/CodeEditorSimple.scss";

export default function CodeEditorSimple({
  code,
  input,
  question,
  editorStates,
  updateEditorState,
  onChangeCode,
  onChangeInput,
  onChangeResult,
  onExecuteResponse,
  difficulty,
  userId,
  lessonId,
}) {
  const [localCode, setLocalCode] = useState("");
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal");
  const [hasNewGuide, setHasNewGuide] = useState(false);

  const lastSavedRef = useRef("");

  // ============================================================
  // RESTORE dữ liệu khi đổi câu / F5
  // ============================================================
  useEffect(() => {
    if (!question?.id) return;

    const local = editorStates?.[question.id] || {};

    setLocalCode(local.code || "");
    setInputText(local.input || "");
    setOutput(local.result || "");
    setGuide(local.guide || "");
    setHasNewGuide(!!local.guide);
    setActiveTab("terminal");
  }, [question?.id, editorStates]);

  // ============================================================
  // AUTO SAVE (GIỐNG CodeEditor)
  // ============================================================
  useEffect(() => {
    if (!userId || !lessonId || !question || question.id == null) return;
    if (!localCode && !inputText && !output && !guide) return;

    const payload = {
      userId,
      lessonId,
      questionId: String(question.id),
      data: {
        code: localCode || "",
        input: inputText || "",
        result: output || "",
        guide: guide || null,
        status: editorStates?.[question.id]?.status ?? null,
      },
    };

    const fingerprint = JSON.stringify(payload.data);
    if (fingerprint === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(() => {
          lastSavedRef.current = fingerprint;
        })
        .catch(console.error);
    }, 1200);

    return () => clearTimeout(timer);
  }, [localCode, inputText, output, guide, question?.id]);

  // ============================================================
  // RUN CODE
  // ============================================================
  const runCode = async () => {
    setLoading(true);
    setOutput("⏳ Đang chạy code...\n");
    setGuide("");
    setHasNewGuide(false);

    try {
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

      const aiResp = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ai/simple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: localCode,
            question:
              question?.question ||
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
      const guideText = aiData.guide || aiData.raw || "";
      setGuide(guideText);
      setHasNewGuide(true);

      updateEditorState?.(question.id, {
        code: localCode,
        input: inputText,
        result: resultOutput,
        guide: guideText,
        status: isSuccess ? "correct" : "wrong",
      });

      // SAVE NGAY SAU RUN
      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          questionId: String(question.id),
          data: {
            code: localCode,
            input: inputText,
            result: resultOutput,
            guide: guideText,
            status: isSuccess ? "correct" : "wrong",
          },
        }),
      });

      lastSavedRef.current = JSON.stringify({
        code: localCode,
        input: inputText,
        result: resultOutput,
        guide: guideText,
        status: isSuccess ? "correct" : "wrong",
      });

      onExecuteResponse?.({
        success: isSuccess,
        instructs: guideText.split("\n").filter(Boolean),
        simpleStatus: isSuccess ? "correct" : "wrong",
        questionId: String(question.id),
      });
    } catch (err) {
      setOutput(`❌ Lỗi: ${err.message}`);
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
        onChange={(v) => {
          setLocalCode(v);
          onChangeCode?.(v);
        }}
      />

      <textarea
        className="code-editor__input"
        placeholder="Nhập input..."
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          onChangeInput?.(e.target.value);
        }}
      />

      <button onClick={runCode} disabled={loading} className="code-editor__run-btn">
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
            <div className="ai-guide">{guide || "Chưa có gợi ý."}</div>
          )}
        </div>
      </div>
    </div>
  );
}
