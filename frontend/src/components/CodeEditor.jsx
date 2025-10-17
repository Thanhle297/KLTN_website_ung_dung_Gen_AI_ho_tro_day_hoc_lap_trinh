// components/CodeEditor.jsx
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
  difficulty, // ✅ nhận thêm prop từ Layout
}) {
  const [results, setResults] = useState([]);
  const [guide, setGuide] = useState(null);
  const [savedStates, setSavedStates] = useState({});
  const [activeTab, setActiveTab] = useState("results");
  const [localCode, setLocalCode] = useState(code || "");
  const [hasNewGuide, setHasNewGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasGuide, setHasGuide] = useState(false);

  const editorRef = useRef(null);

  useEffect(() => {
    if (!question || !question.id) return;
    const questionId = question.id;
    const savedState = savedStates[questionId] || {
      code: "",
      results: [],
      guide: null,
    };
    setLocalCode(savedState.code || code || "");
    setResults(savedState.results || []);
    setGuide(savedState.guide || null);
  }, [question, savedStates, code]);

  const handleCodeChange = (newCode) => {
    setLocalCode(newCode);
    onChangeCode(newCode);
  };

  const runCode = async () => {
    if (!question || !question.testcase || !question.id) {
      onChangeResult("❌ Không có testcase được cung cấp.");
      return;
    }

    

    setLoading(true);
    onChangeResult("⏳ Đang chạy code...");

    const requestData = {
      code: localCode,
      testcases: question.testcase,
      questionId: question.id,
      question: question.title || "",
      difficulty, 
    };

    try {
      const response = await fetch("http://localhost:3001/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        setGuide(data.guide);
        setHasGuide(data.hasGuide);
        setHasNewGuide(data.hasGuide);

        setSavedStates((prev) => ({
          ...prev,
          [question.id]: {
            code: localCode,
            results: data.results,
            guide: data.guide,
          },
        }));

        // 🔹 Nếu có dữ liệu AI, gửi lên Layout
        if (data.ai) {
          onExecuteResponse?.(data.ai);
        }

        const firstResult = data.results[0];
        if (firstResult) {
          onChangeResult(firstResult.actual || "Không có kết quả xuất ra.");
        }
      } else {
        onChangeResult(`❌ Lỗi: ${data.error}`);
      }
    } catch (error) {
      console.error("=== FRONTEND: Error calling API ===", error);
      onChangeResult(`❌ Lỗi kết nối: ${error.message}`);
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
          autocompletion({ override: [] }),
          EditorView.domEventHandlers({
            copy: (e) => e.preventDefault(),
            cut: (e) => e.preventDefault(),
            paste: (e) => e.preventDefault(),
            drop: (e) => e.preventDefault(),
            contextmenu: (e) => e.preventDefault(),
          }),
          EditorView.editable.of(true),
        ]}
        onChange={(value) => {
          handleCodeChange(value);
          setSavedStates((prev) => ({
            ...prev,
            [question.id]: { code: value, results: results || [], guide },
          }));
        }}
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
            className={activeTab === "results" ? "active" : ""}
            onClick={() => setActiveTab("results")}
          >
            Kết quả
          </button>
          <button
            className={`tab-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("guide");
              setHasNewGuide(false);
            }}
            disabled={!hasGuide}
          >
            Hướng dẫn
            {hasGuide && hasNewGuide && (
              <span className="tab-notification"></span>
            )}
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === "results" && (
            <div className="tab-panel">
              {results.length > 0 ? (
                <table border="1" style={{ marginTop: "20px", width: "100%" }}>
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
                <p style={{ whiteSpace: "pre-wrap", color: "#444" }}>{guide}</p>
              ) : (
                <p>Chưa có hướng dẫn. Hãy chạy code để nhận gợi ý từ AI.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
