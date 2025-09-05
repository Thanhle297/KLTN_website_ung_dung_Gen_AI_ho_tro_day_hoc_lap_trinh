// import { useState, useEffect } from "react";
// import CodeMirror from "@uiw/react-codemirror";
// import { python } from "@codemirror/lang-python";
// import "../styles/CodeEditor.scss";

// export default function CodeEditor({
//   code,
//   question,
//   onChangeCode,
//   onChangeResult,
// }) {
//   const [pyodide, setPyodide] = useState(null);
//   const [results, setResults] = useState([]);
//   const [savedStates, setSavedStates] = useState({});
//   const [activeTab, setActiveTab] = useState("results"); // ✅ Tab hiện tại

//   useEffect(() => {
//     const loadPyodideAndPackages = async () => {
//       const pyodideModule = await window.loadPyodide({
//         indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
//       });
//       setPyodide(pyodideModule);
//     };
//     loadPyodideAndPackages();
//   }, []);

//   useEffect(() => {
//     if (!question || !question.id) return;

//     const questionId = question.id;
//     const savedState = savedStates[questionId] || { code: "", results: [] };

//     onChangeCode(savedState.code || code || "");
//     setResults(savedState.results || []);
//   }, [question, savedStates, onChangeCode, code]);

//   const escapeString = (str) => {
//     return str
//       .replace(/\\/g, "\\\\")
//       .replace(/"/g, '\\"')
//       .replace(/\n/g, "\\n");
//   };

//   const normalizeString = (str) => {
//     return str.trim().split(/\s+|\n+/).filter((item) => item !== "").join(" ");
//   };

//   const runCode = async () => {
//     if (!pyodide) {
//       onChangeResult("⏳ Pyodide đang tải...");
//       return;
//     }
//     if (!question || !question.testcase || !question.id) {
//       onChangeResult("❌ Không có testcase được cung cấp.");
//       return;
//     }

//     let allResults = [];
//     for (let tc of question.testcase) {
//       try {
//         const sanitizedInput = Array.isArray(tc.input) ? tc.input : [tc.input];
//         const inputStr = sanitizedInput.join("\n");
//         let outputLines = [];
//         pyodide.setStdout({
//           batched: (msg) => {
//             outputLines.push(msg);
//           },
//         });

//         const escapedInputStr = escapeString(inputStr);

//         let wrappedCode = `
// import sys
// from io import StringIO
// sys.stdin = StringIO("${escapedInputStr}")
// ${code}`;

//         await pyodide.runPythonAsync(wrappedCode);
//         const output = outputLines.join("\n").trim();

//         const normalizedOutput = normalizeString(output);
//         const normalizedExpected = normalizeString(tc.expected);

//         const result = {
//           input: sanitizedInput.join("\n"),
//           expected: tc.expected,
//           actual: output,
//           pass: normalizedOutput === normalizedExpected,
//         };
//         allResults.push(result);
//         onChangeResult(output || "Không có kết quả xuất ra.");
//       } catch (err) {
//         const sanitizedInput = Array.isArray(tc.input) ? tc.input : [tc.input];
//         let errorMessage = err.message;
//         if (err.message.includes("NameError")) {
//           errorMessage = `Lỗi: Biến '${
//             err.message.split("'")[1]
//           }' chưa được định nghĩa.`;
//         }

//         const result = {
//           input: sanitizedInput.join("\n"),
//           expected: tc.expected,
//           actual: `Lỗi: ${errorMessage}`,
//           pass: false,
//         };
//         allResults.push(result);
//         onChangeResult(`Lỗi: ${errorMessage}`);
//       }
//     }

//     setResults(allResults);
//     setSavedStates((prev) => ({
//       ...prev,
//       [question.id]: { code, results: allResults },
//     }));
//   };

//   return (
//     <div className="code-editor">
//       <CodeMirror
//         value={code}
//         height="400px"
//         extensions={[python()]}
//         onChange={(value) => {
//           onChangeCode(value);
//           setSavedStates((prev) => ({
//             ...prev,
//             [question.id]: { code: value, results: results || [] },
//           }));
//         }}
//       />
//       <button className="code-editor__run-btn" onClick={runCode}>
//         Chạy code
//       </button>

//       {/* ✅ Tab layout */}
//       <div className="code-editor__tabs">
//         <div className="tabs-header">
//           <button
//             className={activeTab === "results" ? "active" : ""}
//             onClick={() => setActiveTab("results")}
//           >
//             Kết quả
//           </button>
//           <button
//             className={activeTab === "guide" ? "active" : ""}
//             onClick={() => setActiveTab("guide")}
//           >
//             Hướng dẫn
//           </button>
//         </div>

//         <div className="tabs-content">
//           {activeTab === "results" && (
//             <div className="tab-panel">
//               {results.length > 0 ? (
//                 <table border="1" style={{ marginTop: "20px", width: "100%" }}>
//                   <thead>
//                     <tr>
//                       <th>Input</th>
//                       <th>Expected</th>
//                       <th>Output</th>
//                       <th>Kết quả</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {results.map((r, i) => (
//                       <tr key={i}>
//                         <td>{r.input}</td>
//                         <td>{r.expected}</td>
//                         <td>{r.actual}</td>
//                         <td style={{ color: r.pass ? "green" : "red" }}>
//                           {r.pass ? "✔ Đúng" : "❌ Sai"}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>Chưa có kết quả.</p>
//               )}
//             </div>
//           )}
//           {activeTab === "guide" && (
//             <div className="tab-panel">
//               <p>Hướng dẫn</p>
//               <ul>
//                 <li>Viết code Python vào ô bên trên.</li>
//                 <li>Ấn <b>Chạy code</b> để kiểm tra với testcase.</li>
//                 <li>Kết quả hiển thị ở tab <b>Kết quả</b>.</li>
//               </ul>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// CodeEditor.jsx - Giữ nguyên UI, chỉ sửa hàm runCode
// import { useState, useEffect } from "react";
// import CodeMirror from "@uiw/react-codemirror";
// import { python } from "@codemirror/lang-python";
// import { autocompletion } from "@codemirror/autocomplete";
// import "../styles/CodeEditor.scss";

// export default function CodeEditor({
//   code,
//   question,
//   onChangeCode,
//   onChangeResult,
// }) {
//   const [results, setResults] = useState([]);
//   const [savedStates, setSavedStates] = useState({});
//   const [activeTab, setActiveTab] = useState("results");
//   const [localCode, setLocalCode] = useState(code || ""); // thêm state local

//   useEffect(() => {
//     if (!question || !question.id) return;

//     const questionId = question.id;
//     const savedState = savedStates[questionId] || { code: "", results: [] };

//     // onChangeCode(savedState.code || code || "");
//     setLocalCode(savedState.code || code || ""); // chỉ update local
//     setResults(savedState.results || []);
//   }, [question, savedStates,code]);

//    const handleCodeChange = (newCode) => {
//     setLocalCode(newCode);
//     onChangeCode(newCode); // chỉ gọi khi user thật sự gõ code
//   };

//   const runCode = async () => {
//     if (!question || !question.testcase || !question.id) {
//       onChangeResult("❌ Không có testcase được cung cấp.");
//       return;
//     }

//     onChangeResult("⏳ Đang chạy code...");

//     // Log data trước khi gửi
//     const requestData = {
//       code: localCode, // dùng local
//       testcases: question.testcase,
//       questionId: question.id,
//     };

//     console.log("=== FRONTEND: Sending data to backend ===");
//     console.log("Request URL:", "/api/execute");
//     console.log("Request Data:", requestData);
//     console.log("Code length:", code.length);
//     console.log("Number of testcases:", question.testcase.length);
//     console.log("First testcase:", question.testcase[0]);

//     try {
//       const response = await fetch("http://localhost:3001/api/execute", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(requestData),
//       });

//       console.log("Response status:", response.status);
//       console.log("Response headers:", response.headers);

//       const data = await response.json();
//       console.log("Response data:", data);  

//       if (data.success) {
//         setResults(data.results);
//         setSavedStates((prev) => ({
//           ...prev,
//           [question.id]: { code:localCode, results: data.results },
//         }));

//         const firstResult = data.results[0];
//         if (firstResult) {
//           onChangeResult(firstResult.actual || "Không có kết quả xuất ra.");
//         }
//       } else {
//         onChangeResult(`❌ Lỗi: ${data.error}`);
//       }
//     } catch (error) {
//       console.error("=== FRONTEND: Error calling API ===");
//       console.error("Error details:", error);
//       onChangeResult(`❌ Lỗi kết nối: ${error.message}`);
//     }
//   };
//   // Giữ nguyên phần render UI
//   return (
//     <div className="code-editor">
//       <CodeMirror
//         value={localCode}
//         height="400px"
//         extensions={[python(), autocompletion({ override: [] }) // tắt gợi ý
//         ]}
//         onChange={(value) => {
//           handleCodeChange(value);
//           setSavedStates((prev) => ({
//             ...prev,
//             [question.id]: { code: value, results: results || [] },
//           }));
//         }}
//       />
//       <button className="code-editor__run-btn" onClick={runCode}>
//         Chạy code
//       </button>

//       {/* Giữ nguyên Tab layout */}
//       <div className="code-editor__tabs">
//         <div className="tabs-header">
//           <button
//             className={activeTab === "results" ? "active" : ""}
//             onClick={() => setActiveTab("results")}
//           >
//             Kết quả
//           </button>
//           <button
//             className={activeTab === "guide" ? "active" : ""}
//             onClick={() => setActiveTab("guide")}
//           >
//             Hướng dẫn
//           </button>
//         </div>

//         <div className="tabs-content">
//           {activeTab === "results" && (
//             <div className="tab-panel">
//               {results.length > 0 ? (
//                 <table border="1" style={{ marginTop: "20px", width: "100%" }}>
//                   <thead>
//                     <tr>
//                       <th>Input</th>
//                       <th>Expected</th>
//                       <th>Output</th>
//                       <th>Kết quả</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {results.map((r, i) => (
//                       <tr key={i}>
//                         <td>{r.input}</td>
//                         <td>{r.expected}</td>
//                         <td>{r.actual}</td>
//                         <td style={{ color: r.pass ? "green" : "red" }}>
//                           {r.pass ? "✔ Đúng" : "❌ Sai"}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               ) : (
//                 <p>Chưa có kết quả.</p>
//               )}
//             </div>
//           )}
//           {activeTab === "guide" && (
//             <div className="tab-panel">
//               <p>Hướng dẫn</p>
//               <ul>
//                 <li>Viết code Python vào ô bên trên.</li>
//                 <li>
//                   Ấn <b>Chạy code</b> để kiểm tra với testcase.
//                 </li>
//                 <li>
//                   Kết quả hiển thị ở tab <b>Kết quả</b>.
//                 </li>
//               </ul>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// CodeEditor.jsx
import { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import "../styles/CodeEditor.scss";

export default function CodeEditor({
  code,
  question,
  onChangeCode,
  onChangeResult,
}) {
  const [results, setResults] = useState([]);
  const [guide, setGuide] = useState(null); // ✅ thêm state để lưu hướng dẫn AI
  const [savedStates, setSavedStates] = useState({});
  const [activeTab, setActiveTab] = useState("results");
  const [localCode, setLocalCode] = useState(code || "");

  useEffect(() => {
    if (!question || !question.id) return;

    const questionId = question.id;
    const savedState = savedStates[questionId] || { code: "", results: [], guide: null };

    setLocalCode(savedState.code || code || "");
    setResults(savedState.results || []);
    setGuide(savedState.guide || null); // ✅ khôi phục hướng dẫn đã lưu
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

    onChangeResult("⏳ Đang chạy code...");

    const requestData = {
      code: localCode,
      testcases: question.testcase,
      questionId: question.id,
      question: question.title || "", // ✅ gửi cả câu hỏi cho AI xử lý
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
        setGuide(data.guide); // ✅ lưu hướng dẫn từ AI

        setSavedStates((prev) => ({
          ...prev,
          [question.id]: { code: localCode, results: data.results, guide: data.guide },
        }));

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
    }
  };

  return (
    <div className="code-editor">
      <CodeMirror
        value={localCode}
        height="400px"
        extensions={[python(), autocompletion({ override: [] })]}
        onChange={(value) => {
          handleCodeChange(value);
          setSavedStates((prev) => ({
            ...prev,
            [question.id]: { code: value, results: results || [], guide },
          }));
        }}
      />

      <button className="code-editor__run-btn" onClick={runCode}>
        Chạy code
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
            onClick={() => setActiveTab("guide")}
          >
            Hướng dẫn
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
                <pre style={{ whiteSpace: "pre-wrap", color: "#444" }}>{guide}</pre>
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
