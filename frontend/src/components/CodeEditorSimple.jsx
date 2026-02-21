// components/CodeEditorSimple.jsx
import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import "../styles/CodeEditorSimple.scss";

export default function CodeEditorSimple({
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
  lessonNumber,
}) {
  const [localCode, setLocalCode] = useState("");
  const [inputText, setInputText] = useState("");
  const [output, setOutput] = useState("");
  const [guide, setGuide] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [submittingAI, setSubmittingAI] = useState(false);
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
  // AUTO SAVE
  // ============================================================
  useEffect(() => {
    if (!userId || !lessonId || !question?.id) return;
    if (!localCode && !inputText && !output && !guide) return;

    const data = {
      code: localCode,
      input: inputText,
      result: output,
      guide,
      status: editorStates?.[question.id]?.status ?? null,
    };

    const fingerprint = JSON.stringify(data);
    if (fingerprint === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          questionId: String(question.id),
          data,
        }),
      })
        .then(() => {
          lastSavedRef.current = fingerprint;
        })
        .catch(console.error);
    }, 1200);

    return () => clearTimeout(timer);
  }, [localCode, inputText, output, guide, question?.id]);

  // ============================================================
  // RUN CODE (Chỉ chạy code)
  // ============================================================
  const runCode = async () => {
    if (!question?.id) return;

    setRunningCode(true);
    setOutput("⏳ Đang chạy code...\n");

    try {
      // Chạy code Python
      const runResp = await fetch(
        `${process.env.REACT_APP_API_URL_B}/run_code_simple`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: localCode, input: inputText }),
        }
      );
      const runData = await runResp.json();
      const resultOutput = runData.output || runData.error || "Không có output";

      setOutput(resultOutput);
      onChangeResult?.(resultOutput);

      // Update state (chưa có guide và status)
      const newState = {
        code: localCode,
        input: inputText,
        result: resultOutput,
        guide: guide || "",
        status: editorStates?.[question.id]?.status ?? null,
      };

      updateEditorState?.(question.id, newState);

      // Save ngay
      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          questionId: String(question.id),
          data: newState,
        }),
      });

      lastSavedRef.current = JSON.stringify(newState);
    } catch (err) {
      setOutput(`❌ Lỗi: ${err.message}`);
    } finally {
      setRunningCode(false);
    }
  };

  // ============================================================
  // SUBMIT TO AI (Gọi AI chấm bài)
  // ============================================================
  const submitToAI = async () => {
    if (!question?.id) return;

    // Kiểm tra nếu chưa có output (chưa chạy code)
    if (!output || output === "Chưa có kết quả.") {
      return; // Không làm gì vì nút đã bị disable
    }

    setSubmittingAI(true);
    setGuide("⏳ AI đang chấm bài...\n");
    setHasNewGuide(false);
    setActiveTab("guide"); // Chuyển sang tab Guide để hiển thị kết quả AI

    try {
      // Gọi AI chấm bài
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
            output: output,
            difficulty,
            lessonNumber,
          }),
        }
      );

      const aiData = await aiResp.json();
      const isCorrect = !!aiData.isCorrect;
      const quizzes = aiData.quizzes || [];

      let guideText = aiData.guide || "";

      // 🔴 CHỈ THÊM LOGIC – KHÔNG ĐỔI GIAO DIỆN
      if (difficulty === 2) {
        guideText = isCorrect
          ? "Bài làm đạt yêu cầu."
          : "Bài làm chưa đạt yêu cầu.";
      }

      const cleanedGuide = guideText
        .replace(/^#+\s*/gm, "") // xoá # ở đầu dòng
        .trim();

      setGuide(cleanedGuide);
      setHasNewGuide(true);

      // Update state với guide và status mới
      const newState = {
        code: localCode,
        input: inputText,
        result: output,
        guide: guideText,
        status: isCorrect ? "correct" : "wrong",
      };

      updateEditorState?.(question.id, newState);

      // Save ngay
      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          questionId: String(question.id),
          data: newState,
        }),
      });

      lastSavedRef.current = JSON.stringify(newState);

      // Callback cho parent
      onExecuteResponse?.({
        success: true,
        simpleStatus: isCorrect ? "correct" : "wrong",
        instructs:
          difficulty === 2
            ? [guideText]
            : guideText.split("\n").filter(Boolean),
        quizzes: quizzes,
        questionId: String(question.id),
      });
    } catch (err) {
      setGuide(`❌ Lỗi: ${err.message}`);
      updateEditorState?.(question.id, { status: "wrong" });
    } finally {
      setSubmittingAI(false);
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

      <div className="code-editor__button-group">
        <button
          onClick={runCode}
          disabled={runningCode || submittingAI}
          className="code-editor__run-btn"
        >
          {runningCode ? <ImSpinner2 className="spinner" /> : "Chạy code"}
        </button>

        <button
          onClick={submitToAI}
          disabled={
            runningCode ||
            submittingAI ||
            !output ||
            output === "Chưa có kết quả."
          }
          className="code-editor__submit-btn"
          title={
            !output || output === "Chưa có kết quả."
              ? "Vui lòng chạy code trước khi submit cho AI chấm"
              : ""
          }
        >
          {submittingAI ? <ImSpinner2 className="spinner" /> : "Chấm bài"}
        </button>
      </div>

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
