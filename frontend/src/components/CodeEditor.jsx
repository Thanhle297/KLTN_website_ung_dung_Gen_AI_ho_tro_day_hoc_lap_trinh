import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import "../styles/CodeEditor.scss";

export default function CodeEditor({
  code,
  question,
  onChangeCode,
  onChangeResult,
  onExecuteResponse,
  difficulty,
  userId,
  lessonId,
}) {
  const [results, setResults] = useState([]);
  const [guide, setGuide] = useState(null);
  const [localCode, setLocalCode] = useState(code || "");
  const [activeTab, setActiveTab] = useState("results");
  const [loading, setLoading] = useState(false);
  const [hasGuide, setHasGuide] = useState(false);
  const [hasNewGuide, setHasNewGuide] = useState(false);
  const lastSavedRef = useRef("");

  const editorRef = useRef(null);

  // ✅ Load dữ liệu tạm riêng cho câu hỏi này
  useEffect(() => {
    if (!question || !userId) return;
    const loadTemp = async () => {
      const res = await fetch(
        `http://103.90.224.183:3001/api/temp/load?userId=${userId}&lessonId=${lessonId}`
      );
      const tempData = await res.json();
      const match = Array.isArray(tempData)
        ? tempData.find((t) => t.questionId === question.id)
        : null;

      if (match?.code) {
        setLocalCode(match.code);
        setResults(match.results || []);
        setGuide(match.guide || null);
      }
    };
    loadTemp();
  }, [question, userId, lessonId]);

  // Reset code khi đổi câu
  useEffect(() => {
    setLocalCode(code || "");
    setResults([]);
    setGuide(null);
  }, [question, code]);

  // ✅ Auto-save theo từng câu hỏi
  useEffect(() => {
    if (!userId || !lessonId || !question) return;
    if (localCode.trim() === lastSavedRef.current.trim()) return;

    const timer = setTimeout(() => {
      fetch("http://103.90.224.183:3001/api/temp/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          lessonId,
          questionId: question.id,
          data: { code: localCode, results, guide },
        }),
      })
        .then(() => {
          lastSavedRef.current = localCode;
          console.log(`💾 Auto-saved question ${question.id}`);
        })
        .catch((err) => console.error("❌ Save failed:", err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [localCode, results, guide, userId, lessonId, question]);

  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    onChangeCode(newCode);
  };

  // ✅ Run code
  const runCode = async () => {
    if (!question?.testcase) {
      onChangeResult("❌ Không có testcase được cung cấp.");
      return;
    }

    setLoading(true);
    onChangeResult("⏳ Đang chạy code...");

    try {
      const res = await fetch("http://103.90.224.183:3001/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: localCode,
          testcases: question.testcase,
          questionId: question.id,
          difficulty,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResults(data.results);
        setGuide(data.guide);
        setHasGuide(!!data.guide);
        setHasNewGuide(!!data.guide);
        if (data.ai) onExecuteResponse?.(data.ai);
        onChangeResult(
          data.results?.[0]?.actual || "Không có kết quả xuất ra."
        );
      } else {
        onChangeResult(`❌ Lỗi: ${data.error}`);
      }
    } catch (err) {
      onChangeResult(`❌ Lỗi kết nối: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="code-editor">
      <CodeMirror
        ref={editorRef}
        value={localCode}
        height="400px"
        extensions={[
          python(),
          EditorView.editable.of(true), // vẫn cho gõ
          autocompletion({ override: [] })
        ]}
        onChange={(value) => handleCodeChange(value)}
        onPaste={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
      />

      <button
        onClick={runCode}
        disabled={loading}
        className="code-editor__run-btn"
      >
        {loading ? <ImSpinner2 className="spinner" /> : "Chạy code"}
      </button>

      <div className="code-editor__tabs">
        <div className="tabs-header">
          <button
            className={activeTab === "results" ? "active" : ""}
            onClick={() => setActiveTab("results")}
          >
            Kết quả
          </button>
          <button
            className={activeTab === "guide" ? "active" : ""}
            onClick={() => {
              setActiveTab("guide");
              setHasNewGuide(false);
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
                <table border="1" style={{ width: "100%" }}>
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
                      <tr key={i}>
                        <td style={{ whiteSpace: "pre-wrap" }}>{r.input}</td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{r.expected}</td>
                        <td style={{ whiteSpace: "pre-wrap" }}>{r.actual}</td>
                        <td style={{ color: r.pass ? "green" : "red" }}>
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
