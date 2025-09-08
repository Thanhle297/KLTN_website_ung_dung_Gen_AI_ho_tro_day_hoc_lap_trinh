import React from "react";
import Layout from "../components/Layout";
import CodeEditorDemo from "../components/CodeEditorDemo"
// import CodeEditorWithGutter from "../components/CodeEditorWithGutter";

export default function CodeEx({questions}) {
  return (
    <div>
      {questions&&questions.length > 0 ? (
        <Layout questions={questions} />
      ) : (
        <p>Đang tải câu hỏi...</p>
      )}
      {/* <CodeEditorDemo/> */}
      {/* <CodeEditorWithGutter/> */}
    </div>
  );
}
