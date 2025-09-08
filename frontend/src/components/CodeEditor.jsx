// frontend/components/CodeEditor.jsx
import { useState, useEffect, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { ImSpinner2 } from "react-icons/im";
import {
  StateField,
  StateEffect,
  RangeSetBuilder,
} from "@codemirror/state";
import { gutter, GutterMarker } from "@codemirror/view";
import "../styles/CodeEditor.scss";

// ==== Marker cho lỗi từng dòng ====
const addWarnings = StateEffect.define();

// Quản lý popup toàn cục
let activePopups = [];

class LineMarker extends GutterMarker {
  constructor(message) {
    super();
    this.message = message;
  }

  toDOM() {
    const span = document.createElement("span");
    span.style.cursor = this.message ? "pointer" : "default";
    span.style.color = this.message ? "red" : "inherit";
    span.textContent = this.message ? "⚠️" : ""; // ❌ không hiển thị số dòng

    if (this.message) {
      span.onclick = (ev) => {
        ev.stopPropagation();

        // Xóa tất cả popup cũ
        activePopups.forEach((p) => p.remove());
        activePopups = [];

        const popup = document.createElement("div");
        popup.className = "error-popup"; // sử dụng class CSS
        popup.textContent = this.message;
        document.body.appendChild(popup);

        const rect = span.getBoundingClientRect();
        popup.style.left = rect.right + 5 + "px";
        popup.style.top = rect.top + "px";

        activePopups.push(popup);

        const removePopup = () => {
          popup.remove();
          activePopups = activePopups.filter((p) => p !== popup);
          document.removeEventListener("click", removePopup);
        };
        setTimeout(() => document.addEventListener("click", removePopup), 0);
      };
    }
    return span;
  }
}

const lineMarkersField = StateField.define({
  create() {
    return new RangeSetBuilder().finish();
  },
  update(deco, tr) {
    let result = deco.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addWarnings)) {
        const builder = new RangeSetBuilder();
        const doc = tr.state.doc;

        for (let i = 1; i <= doc.lines; i++) {
          const msgObj = e.value.find((w) => w.line === i);
          const lineInfo = doc.line(i);

          if (msgObj) {
            builder.add(lineInfo.from, lineInfo.from, new LineMarker(msgObj.message));
          }
        }
        result = builder.finish();
      }
    }
    return result;
  },
});

const lineGutter = gutter({
  class: "cm-lineNumbers",
  markers: (view) => view.state.field(lineMarkersField),
});

export default function CodeEditor({
  code,
  question,
  onChangeCode,
  onChangeResult,
}) {
  const [results, setResults] = useState([]);
  const [guide, setGuide] = useState(null);
  const [savedStates, setSavedStates] = useState({});
  const [activeTab, setActiveTab] = useState("results");
  const [localCode, setLocalCode] = useState(code || "");
  const [hasNewGuide, setHasNewGuide] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasGuide, setHasGuide] = useState(false); // thêm

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
        setHasGuide(data.hasGuide)
        setHasNewGuide(data.hasGuide);

        setSavedStates((prev) => ({
          ...prev,
          [question.id]: {
            code: localCode,
            results: data.results,
            guide: data.guide,
          },
        }));

        if (editorRef.current) {
          // Xóa popup cũ khi chạy lại code
          activePopups.forEach((p) => p.remove());
          activePopups = [];

          editorRef.current.view.dispatch({
            effects: addWarnings.of(data.lineHints || []),
          });
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
        // basicSetup={{ lineNumbers: false }}
        extensions={[python(), autocompletion({ override: [] }), lineMarkersField, lineGutter]}
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
            disabled ={!hasGuide}
          >
            Hướng dẫn
            {hasGuide && hasNewGuide && <span className="tab-notification"></span>}
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
                        <td>{r.input}</td>
                        <td>{r.expected}</td>
                        <td>{r.actual}</td>
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
