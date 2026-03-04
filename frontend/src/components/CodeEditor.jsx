// CodeEditor.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { ImSpinner2 } from "react-icons/im";
import { useThemeMode } from "../context/ThemeContext";
import fireConfetti from "../utils/fireConfetti";
import "../styles/CodeEditor.scss";

export default function CodeEditor({
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
  const [localCode, setLocalCode] = useState("");
  const [activeTab, setActiveTab] = useState("results");
  const [loading, setLoading] = useState(false);
  const [hasGuide, setHasGuide] = useState(false);
  const [hasNewGuide, setHasNewGuide] = useState(false);

  const editorRef = useRef(null);
  const lastSavedRef = useRef(""); // lưu fingerprint payload đã save gần nhất

  const apiBase = useMemo(() => process.env.REACT_APP_API_URL, []);

  // ============================================================
  // Sync theo question/editorStates (source-of-truth: editorStates)
  // ============================================================
  useEffect(() => {
    if (!question?.id) return;

    const local = editorStates?.[question.id];
    if (local) {
      setLocalCode(local.code || "");
      setResults(Array.isArray(local.results) ? local.results : []);
      setGuide(local.guide ?? null);
      setHasGuide(!!local.guide);
      setHasNewGuide(!!local.hasNewGuide);
    } else {
      setLocalCode("");
      setResults([]);
      setGuide(null);
      setHasGuide(false);
      setHasNewGuide(false);
    }

    // reset tab hợp lý
    setActiveTab("results");
  }, [question?.id, editorStates]);

  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    onChangeCode?.(newCode);
    updateEditorState?.(question.id, { code: newCode });
  };

  // ============================================================
  // Auto-save: lưu FULL state (code + results + guide + status + hasNewGuide)
  // ============================================================
  useEffect(() => {
    if (
      !userId ||
      !lessonId ||
      !question ||
      !question.id ||
      question.id == null
    ) {
      return;
    }

    // Không lưu nếu chưa có gì
    if (!localCode && results.length === 0 && !guide) return;

    const payload = {
      userId,
      lessonId,
      questionId: String(question.id),
      data: {
        code: localCode || "",
        results: results || [],
        guide: guide ?? null,
        status: editorStates?.[question.id]?.status ?? null,
        hasNewGuide: !!hasNewGuide,
      },
    };

    const fingerprint = JSON.stringify(payload.data);
    if (fingerprint === lastSavedRef.current) return;

    const timer = setTimeout(() => {
      fetch(`${apiBase}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => {
          lastSavedRef.current = fingerprint;
        })
        .catch((err) => console.error("❌ Auto-save failed:", err));
    }, 1200);

    return () => clearTimeout(timer);
  }, [localCode, results, guide, hasNewGuide, question?.id]);

  // ============================================================
  // Run code
  // ============================================================
  const runCode = async () => {
    if (!question?.testcase) {
      onChangeResult?.("❌ Không có testcase được cung cấp.");
      return;
    }

    setLoading(true);
    onChangeResult?.("⏳ Đang chạy code...");

    try {
      const res = await fetch(`${apiBase}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        onChangeResult?.(`❌ Lỗi: ${data.error}`);
        return;
      }

      const newResults = Array.isArray(data.results) ? data.results : [];
      const newGuide = data.guide ?? null;
      const isAllPass =
        newResults.length > 0 ? newResults.every((r) => r.pass) : false;

      setResults(newResults);
      setGuide(newGuide);
      setHasGuide(!!newGuide);
      setHasNewGuide(!!newGuide);

      // ✅ Bắn confetti nếu đúng hết
      if (isAllPass) fireConfetti();

      // ✅ Update state tổng hợp (source-of-truth)
      updateEditorState?.(question.id, {
        code: localCode,
        results: newResults,
        guide: newGuide,
        hasNewGuide: !!newGuide,
        status: isAllPass ? "correct" : "wrong",
      });

      // ✅ Save ngay sau run để đảm bảo F5 không mất (lưu full)
      const payload = {
        userId,
        lessonId,
        questionId: String(question.id),
        data: {
          code: localCode,
          results: newResults,
          guide: newGuide,
          status: isAllPass ? "correct" : "wrong",
          hasNewGuide: !!newGuide,
        },
      };

      await fetch(`${apiBase}/api/temp/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      lastSavedRef.current = JSON.stringify(payload.data);

      onExecuteResponse?.({
        ...(data.ai || {}),
        autoStatus: isAllPass ? "correct" : "wrong",
        questionId: String(question.id),
      });

      onChangeResult?.(newResults?.[0]?.actual || "Không có kết quả xuất ra.");
    } catch (err) {
      onChangeResult?.(`❌ Lỗi kết nối: ${err.message}`);
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

  return (
    <div className="code-editor">
      <div role="group" aria-label="Trình soạn code Python">
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

      <div className="code-editor__actions">
        <input
          type="file"
          accept=".py"
          id="upload-file"
          style={{ display: "none" }}
          onChange={handleFileUpload}
          aria-label="Tải file Python"
        />
        <label htmlFor="upload-file" className="upload-btn">
          📂 Tải file Python
        </label>

        <button
          type="button"
          onClick={runCode}
          disabled={loading}
          className="code-editor__run-btn"
        >
          {loading ? <ImSpinner2 className="spinner" /> : "Chạy code"}
        </button>
      </div>

      {/* Tabs */}
      <div className="code-editor__tabs">
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
            Hướng dẫn{" "}
            {hasGuide && hasNewGuide && (
              <span className="tab-notification"></span>
            )}
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "results" && (
            <div className="tab-panel">
              {results.length ? (
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
                        <td style={{ whiteSpace: "pre-wrap" }}>{r.expected}</td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{r.actual}</td>
                        <td style={{ color: r.pass ? "#15803d" : "#dc2626" }}>
                          {r.pass ? "✔ Đúng" : "❌ Sai"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Chưa có kết quả.</p>
              )}
            </div>
          )}

          {activeTab === "guide" && (
            <div className="tab-panel">
              {guide ? (
                <p style={{ whiteSpace: "pre-wrap" }}>{guide}</p>
              ) : (
                <p>Chưa có hướng dẫn.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
