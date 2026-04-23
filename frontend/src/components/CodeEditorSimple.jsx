// components/CodeEditorSimple.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { ImSpinner2 } from "react-icons/im";
import { useThemeMode } from "../context/ThemeContext";
import fireConfetti from "../utils/fireConfetti";
import AIMarkdown from "./AIMarkdown";
import InteractiveTerminal from "./InteractiveTerminal";
import "../styles/CodeEditorSimple.scss";

// Tạo WebSocket URL từ HTTP URL của python-service
const PYTHON_SERVICE_URL = process.env.REACT_APP_API_URL_B || "http://localhost:8001";
const WS_URL = PYTHON_SERVICE_URL.replace(/^http/, "ws") + "/ws/run_simple";

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
  const { isDark } = useThemeMode();
  const [localCode, setLocalCode] = useState("");
  const [output, setOutput] = useState("");
  const [collectedInput, setCollectedInput] = useState("");
  const [guide, setGuide] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [submittingAI, setSubmittingAI] = useState(false);
  const [activeTab, setActiveTab] = useState("terminal");
  const [hasNewGuide, setHasNewGuide] = useState(false);

  const lastSavedRef = useRef("");
  const terminalRef = useRef(null);

  // ============================================================
  // RESTORE dữ liệu khi đổi câu / F5
  // ============================================================
  useEffect(() => {
    if (!question?.id) return;

    const local = editorStates?.[question.id] || {};
    setLocalCode(local.code || "");
    setOutput(local.result || "");
    setCollectedInput(local.input || "");
    setGuide(local.guide || "");
    setHasNewGuide(!!local.guide);
    setActiveTab("terminal");

    // Cleanup terminal khi đổi câu hỏi
    if (terminalRef.current) {
      terminalRef.current.stopExecution();
      terminalRef.current.clearTerminal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  // ============================================================
  // AUTO SAVE
  // ============================================================
  useEffect(() => {
    if (!userId || !lessonId || !question?.id) return;
    if (!localCode && !collectedInput && !output && !guide) return;

    const data = {
      code: localCode,
      input: collectedInput,
      result: output,
      guide,
      status: editorStates?.[question.id]?.status ?? null,
    };

    const fingerprint = JSON.stringify(data);
    if (fingerprint === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      const token = localStorage.getItem("token");
      fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
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
  }, [localCode, collectedInput, output, guide, question?.id]);

  // ============================================================
  // Callbacks từ InteractiveTerminal
  // ============================================================
  const handleRunStateChange = useCallback((isRunning) => {
    setRunningCode(isRunning);
  }, []);

  const handleOutputReady = useCallback(
    (termOutput) => {
      const resultOutput = termOutput || "Không có output";
      setOutput(resultOutput);
      onChangeResult?.(resultOutput);

      // Update state + save ngay
      const newState = {
        code: localCode,
        input: collectedInput,
        result: resultOutput,
        guide: guide || "",
        status: editorStates?.[question?.id]?.status ?? null,
      };

      updateEditorState?.(question?.id, newState);

      // Save to backend
      if (userId && lessonId && question?.id) {
        const token = localStorage.getItem("token");
        fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            lessonId,
            questionId: String(question.id),
            data: newState,
          }),
        })
          .then(() => {
            lastSavedRef.current = JSON.stringify(newState);
          })
          .catch(console.error);
      }
    },
    [
      localCode,
      collectedInput,
      guide,
      question?.id,
      editorStates,
      updateEditorState,
      onChangeResult,
      userId,
      lessonId,
    ]
  );

  const handleInputCollected = useCallback(
    (inputs) => {
      setCollectedInput(inputs);
      onChangeInput?.(inputs);
    },
    [onChangeInput]
  );

  // ============================================================
  // RUN CODE (qua WebSocket InteractiveTerminal)
  // ============================================================
  const runCode = () => {
    if (!question?.id) return;

    setActiveTab("terminal");
    // Gọi InteractiveTerminal bắt đầu chạy
    terminalRef.current?.startExecution(localCode);
  };

  // ============================================================
  // STOP CODE
  // ============================================================
  const stopCode = () => {
    terminalRef.current?.stopExecution();
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
      const token = localStorage.getItem("token");
      const authHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Gọi AI chấm bài
      const aiResp = await fetch(
        `${process.env.REACT_APP_API_URL}/api/ai/simple`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            code: localCode,
            question:
              question?.question ||
              question?.description ||
              question?.title ||
              "Không có đề bài",
            input: collectedInput,
            output: output,
            difficulty,
            lessonNumber,
          }),
        }
      );

      const aiData = await aiResp.json();
      const isCorrect = !!aiData.isCorrect;
      const quizzes = aiData.quizzes || [];

      // Bắn confetti nếu đúng
      if (isCorrect) fireConfetti();

      let guideText = aiData.guide || "";

      // CHỈ THÊM LOGIC – KHÔNG ĐỔI GIAO DIỆN
      if (difficulty === 2) {
        guideText = isCorrect
          ? "Bài làm đạt yêu cầu."
          : "Bài làm chưa đạt yêu cầu.";
      }

      setGuide(guideText);
      setHasNewGuide(true);

      // Update state với guide và status mới
      const newState = {
        code: localCode,
        input: collectedInput,
        result: output,
        guide: guideText,
        status: isCorrect ? "correct" : "wrong",
      };

      updateEditorState?.(question.id, newState);

      // Save ngay
      await fetch(`${process.env.REACT_APP_API_URL}/api/temp/save`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
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
      <div role="group" aria-label="Trình soạn code Python">
        <CodeMirror
          value={localCode}
          height="400px"
          theme={isDark ? oneDark : "light"}
          extensions={[python(), autocompletion({ override: [] })]}
          onChange={(v) => {
            setLocalCode(v);
            onChangeCode?.(v);
          }}
        />
      </div>

      <div className="code-editor__button-group">
        <input
          type="file"
          accept=".py"
          id="upload-file-simple"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const fileContent = event.target?.result?.toString?.() ?? "";
              setLocalCode(fileContent);
              onChangeCode?.(fileContent);
              updateEditorState?.(question.id, { code: fileContent });
            };
            reader.readAsText(file);
            e.target.value = "";
          }}
          aria-label="Tải file Python"
        />
        <label htmlFor="upload-file-simple" className="upload-btn">
          Tải file Python
        </label>
        {runningCode ? (
          <button
            type="button"
            onClick={stopCode}
            className="code-editor__stop-btn"
          >
            Dừng
          </button>
        ) : (
          <button
            type="button"
            onClick={runCode}
            disabled={submittingAI}
            className="code-editor__run-btn"
          >
            Chạy code
          </button>
        )}

        <button
          type="button"
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
            type="button"
            className={activeTab === "terminal" ? "active" : ""}
            onClick={() => {
              setActiveTab("terminal");
              // Re-fit xterm khi tab chuyển về visible
              requestAnimationFrame(() => terminalRef.current?.refit());
            }}
          >
            Terminal
          </button>
          <button
            type="button"
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
          <div style={{ display: activeTab === "terminal" ? "block" : "none" }}>
            <InteractiveTerminal
              ref={terminalRef}
              wsUrl={WS_URL}
              onRunStateChange={handleRunStateChange}
              onOutputReady={handleOutputReady}
              onInputCollected={handleInputCollected}
            />
          </div>
          {activeTab === "guide" && (
            <div className="ai-guide">
              <AIMarkdown
                content={guide}
                emptyText="Chưa có gợi ý."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
