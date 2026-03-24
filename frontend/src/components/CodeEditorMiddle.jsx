// components/CodeEditorMiddle.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { ImSpinner2 } from "react-icons/im";
import { useThemeMode } from "../context/ThemeContext";
import AIMarkdown from "./AIMarkdown";
import "../styles/CodeEditorMiddle.scss";

/**
 * Badge hiển thị trạng thái tổng hợp 3 mức
 */
function StatusBadge({ status }) {
  if (!status) return null;

  const map = {
    correct: { label: "Đạt", className: "badge--correct" },
    partial: { label: "Đúng một phần", className: "badge--partial" },
    wrong: { label: "Không đạt", className: "badge--wrong" },
  };

  const info = map[status];
  if (!info) return null;

  return <span className={`status-badge ${info.className}`}>{info.label}</span>;
}

export default function CodeEditorMiddle({
  question,
  onChangeCode,
  onChangeResult,
  onExecuteResponse,
  updateEditorState,
  editorStates,
  difficulty,
  userId,
  lessonId,
  lessonNumber,
}) {
  const { isDark } = useThemeMode();
  const [results, setResults] = useState([]);
  const [guide, setGuide] = useState(null);
  const [aiResult, setAiResult] = useState(null); // "PASS" | "PARTIAL" | "FAIL"
  const [combinedStatus, setCombinedStatus] = useState(null); // "correct" | "partial" | "wrong"
  const [localCode, setLocalCode] = useState("");
  const [activeTab, setActiveTab] = useState("results");
  const [loading, setLoading] = useState(false);
  const [hasGuide, setHasGuide] = useState(false);
  const [hasNewGuide, setHasNewGuide] = useState(false);

  const editorRef = useRef(null);
  const lastSavedRef = useRef("");

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL, []);

  // ============================================================
  // Effect 1: CHỈ reset tab về "results" khi đổi sang câu hỏi khác
  // Tách riêng để tránh reset tab mỗi khi updateEditorState được gọi
  // ============================================================
  useEffect(() => {
    if (!question?.id) return;
    setActiveTab("results");
  }, [question?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================
  // Effect 2: Sync local state từ editorStates (source-of-truth)
  // KHÔNG gọi setActiveTab ở đây — để tab guide có thể giữ nguyên sau runCode
  // ============================================================
  useEffect(() => {
    if (!question?.id) return;

    const local = editorStates?.[question.id];
    if (local) {
      setLocalCode(local.code || "");
      setResults(Array.isArray(local.results) ? local.results : []);
      setGuide(local.guide ?? null);
      setAiResult(local.aiResult ?? null);
      setCombinedStatus(local.status ?? null);
      setHasGuide(!!local.guide);
      setHasNewGuide(!!local.hasNewGuide);
    } else {
      setLocalCode("");
      setResults([]);
      setGuide(null);
      setAiResult(null);
      setCombinedStatus(null);
      setHasGuide(false);
      setHasNewGuide(false);
    }
  }, [question?.id, editorStates]);

  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    onChangeCode?.(newCode);
    updateEditorState?.(question.id, { code: newCode });
  };

  // ============================================================
  // Auto-save: luu FULL state
  // ============================================================
  useEffect(() => {
    if (!userId || !lessonId || !question?.id) return;
    if (!localCode && results.length === 0 && !guide) return;

    const payload = {
      lessonId,
      questionId: String(question.id),
      data: {
        code: localCode || "",
        results: results || [],
        guide: guide ?? null,
        aiResult: aiResult ?? null,
        status: combinedStatus ?? null,
        hasNewGuide: !!hasNewGuide,
      },
    };

    const fingerprint = JSON.stringify(payload.data);
    if (fingerprint === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      const token = localStorage.getItem("token");
      fetch(`${apiBase}/api/temp/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => {
          lastSavedRef.current = fingerprint;
        })
        .catch((err) => console.error("Auto-save failed:", err));
    }, 1200);

    return () => clearTimeout(timer);
  }, [
    localCode,
    results,
    guide,
    aiResult,
    combinedStatus,
    hasNewGuide,
    question?.id,
  ]);

  // ============================================================
  // Run code: goi /api/execute-middle (testcase + AI trong 1 call)
  // ============================================================
  const runCode = async () => {
    if (!question?.testcase) {
      onChangeResult?.("Không có testcase được cung cấp.");
      return;
    }

    setLoading(true);
    onChangeResult?.("Đang chạy code...");

    try {
      const token = localStorage.getItem("token");
      const authHeaders = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const res = await fetch(`${apiBase}/api/execute-middle`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          code: localCode,
          testcases: question.testcase,
          question: question.question,
          questionId: String(question.id),
          difficulty,
          echo_input: question.echo_input ?? false,
          lessonId,
          lessonNumber,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        onChangeResult?.(`Lỗi: ${data.error}`);
        return;
      }

      const newResults = Array.isArray(data.results) ? data.results : [];
      const newGuide = data.guide ?? null;
      const newAiResult = data.aiResult ?? null; // "PASS" | "PARTIAL" | "FAIL"
      const newCombinedStatus = data.combinedStatus ?? "wrong";

      setResults(newResults);
      setGuide(newGuide);
      setAiResult(newAiResult);
      setCombinedStatus(newCombinedStatus);
      setHasGuide(!!newGuide);
      setHasNewGuide(!!newGuide);

      // Update state tong hop (source-of-truth)
      updateEditorState?.(question.id, {
        code: localCode,
        results: newResults,
        guide: newGuide,
        aiResult: newAiResult,
        hasNewGuide: !!newGuide,
        status: newCombinedStatus,
      });

      // Save ngay sau run de dam bao F5 khong mat
      const savePayload = {
        lessonId,
        questionId: String(question.id),
        data: {
          code: localCode,
          results: newResults,
          guide: newGuide,
          aiResult: newAiResult,
          status: newCombinedStatus,
          hasNewGuide: !!newGuide,
        },
      };

      await fetch(`${apiBase}/api/temp/save`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(savePayload),
      });

      lastSavedRef.current = JSON.stringify(savePayload.data);

      // Callback cho parent (Layout) de hien Popup
      onExecuteResponse?.({
        ...(data.ai || {}),
        combinedStatus: newCombinedStatus,
        aiResult: newAiResult,
        questionId: String(question.id),
      });

      onChangeResult?.(newResults?.[0]?.actual || "Không có kết quả xuất ra.");
    } catch (err) {
      onChangeResult?.(`Lỗi kết nối: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload file
  const handleFileUpload = (e) => {
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
  };

  // ============================================================
  // Helper: render ket qua testcase + badge trong bang
  // ============================================================
  const renderResultCell = (pass) => {
    if (pass) {
      return <span className="result-pass">Đúng</span>;
    }
    return <span className="result-fail">Sai</span>;
  };

  return (
    <div className="code-editor-middle">
      {/* CodeMirror */}
      <div role="group" aria-label="Trinh soan code Python">
        <CodeMirror
          ref={editorRef}
          value={localCode}
          height="400px"
          theme={isDark ? oneDark : "light"}
          extensions={[
            python(),
            EditorView.editable.of(true),
            autocompletion({ override: [] }),
          ]}
          onChange={(value) => handleCodeChange(value)}
        />
      </div>

      {/* Actions row */}
      <div className="code-editor-middle__actions">
        <input
          type="file"
          accept=".py"
          id="upload-file-middle"
          style={{ display: "none" }}
          onChange={handleFileUpload}
          aria-label="Up file Python"
        />
        <label htmlFor="upload-file-middle" className="upload-btn">
          Up file Python
        </label>

        <button
          type="button"
          onClick={runCode}
          disabled={loading}
          className="code-editor-middle__run-btn"
        >
          {loading ? <ImSpinner2 className="spinner" /> : "Chạy code"}
        </button>

        {/* Badge trang thai tong hop */}
        <StatusBadge status={combinedStatus} />
      </div>

      {/* Tabs */}
      <div className="code-editor-middle__tabs">
        <div className="tabs-header">
          <button
            type="button"
            className={activeTab === "results" ? "active" : ""}
            onClick={() => setActiveTab("results")}
          >
            Kết quả
          </button>

          <button
            type="button"
            className={activeTab === "guide" ? "active" : ""}
            onClick={() => {
              setActiveTab("guide");
              setHasNewGuide(false);
              updateEditorState?.(question.id, { hasNewGuide: false });
            }}
            disabled={!hasGuide}
          >
            Hướng dẫn AI{" "}
            {hasGuide && hasNewGuide && (
              <span className="tab-notification"></span>
            )}
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "results" && (
            <div className="tab-panel">
              {results.length ? (
                <>
                  {/* Summary row */}
                  <div className="results-summary">
                    <span>
                      Testcase: {results.filter((r) => r.pass).length}/
                      {results.length} đạt
                    </span>
                    {/* {aiResult && (
                      <span
                        className={`ai-tag ai-tag--${aiResult.toLowerCase()}`}
                      >
                        AI: {aiResult}
                      </span>
                    )} */}
                  </div>

                  <table
                    border="1"
                    style={{ width: "100%" }}
                    aria-label="Kết quả chạy code"
                  >
                    <thead>
                      <tr>
                        <th>Input</th>
                        <th>Expected</th>
                        <th>Output</th>
                        <th>Kết quả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={`${question.id}_${i}`}>
                          <td style={{ whiteSpace: "pre-wrap" }}>{r.input}</td>
                          <td style={{ whiteSpace: "pre-wrap" }}>
                            {r.expected}
                          </td>
                          <td style={{ whiteSpace: "pre-wrap" }}>{r.actual}</td>
                          <td>{renderResultCell(r.pass)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p>Chưa có kết quả.</p>
              )}
            </div>
          )}

          {activeTab === "guide" && (
            <div className="tab-panel">
              <AIMarkdown
                content={guide}
                emptyText="Chưa có hướng dẫn."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
