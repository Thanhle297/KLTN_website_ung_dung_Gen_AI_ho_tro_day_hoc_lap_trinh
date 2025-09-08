import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import {
  EditorView,
  gutter,
  GutterMarker,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { StateField, StateEffect, RangeSetBuilder } from "@codemirror/state";

// Hiệu ứng thêm cảnh báo
const addWarnings = StateEffect.define();

// Marker hiển thị số dòng hoặc ⚠️ nếu lỗi
class LineMarker extends GutterMarker {
  constructor(lineNo, message) {
    super();
    this.lineNo = lineNo;
    this.message = message; // undefined nếu không lỗi
  }

  toDOM() {
    const span = document.createElement("span");
    span.style.cursor = this.message ? "pointer" : "default";
    span.style.color = this.message ? "red" : "inherit";
    span.style.userSelect = "none";
    span.style.display = "flex"; // thêm
    span.style.alignItems = "center"; // thêm
    span.style.justifyContent = "center"; // thêm
    span.style.width = "100%"; // chiếm full ô gutter
    span.textContent = this.message ? "⚠️" : this.lineNo.toString();

    if (this.message) {
      span.onclick = (ev) => {
        ev.stopPropagation();
        const popup = document.createElement("div");
        popup.textContent = this.message;
        popup.style.position = "absolute";
        popup.style.background = "#fff";
        popup.style.border = "1px solid #ccc";
        popup.style.padding = "6px 8px";
        popup.style.borderRadius = "6px";
        popup.style.boxShadow = "0px 2px 10px rgba(0,0,0,0.2)";
        popup.style.zIndex = 1000;
        document.body.appendChild(popup);
        const rect = span.getBoundingClientRect();
        popup.style.left = rect.right + 5 + "px";
        popup.style.top = rect.top + "px";

        const removePopup = () => {
          popup.remove();
          document.removeEventListener("click", removePopup);
        };
        setTimeout(() => document.addEventListener("click", removePopup), 0);
      };
    }

    return span;
  }

  eq(other) {
    return (
      other instanceof LineMarker &&
      other.lineNo === this.lineNo &&
      other.message === this.message
    );
  }
}

// StateField quản lý các line markers
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
        const maxLine = doc.lines;
        for (let i = 1; i <= maxLine; i++) {
          const messageObj = e.value.find((w) => w.line === i);
          const lineInfo = doc.line(i);
          const marker = new LineMarker(
            i,
            messageObj ? messageObj.message : undefined
          );
          builder.add(lineInfo.from, lineInfo.from, marker);
        }
        result = builder.finish();
      }
    }
    return result;
  },
});

// Custom gutter
const lineGutter = gutter({
  class: "cm-lineNumbers",
  markers: (view) => view.state.field(lineMarkersField),
  initialSpacer: () => new LineMarker(1),
});

export default function CodeEditorDemo() {
  const onCreateEditor = (view) => {
    view.dispatch({
      effects: addWarnings.of([
        { line: 2, message: "Lỗi: Biến chưa khai báo" },
        { line: 3, message: "Lỗi: Thiếu dấu ngoặc" },
      ]),
    });
  };

  return (
    <CodeMirror
      value={`print("Hello")\nprint(x)\nprint("Done"`}
      height="200px"
      basicSetup={{ lineNumbers: false }}
      extensions={[
        python(),
        lineMarkersField,
        lineGutter,
        highlightActiveLineGutter(),
      ]}
      onCreateEditor={onCreateEditor}
    />
  );
}
