// components/InteractiveTerminal.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

/**
 * InteractiveTerminal - Terminal tương tác dùng xterm.js + WebSocket.
 *
 * Cho phép chạy code Python với input() tương tác real-time,
 * giống terminal IDE (VS Code, PyCharm).
 *
 * Props:
 *   wsUrl          - WebSocket URL (vd: ws://localhost:8001/ws/run_simple)
 *   onRunStateChange - Callback khi trạng thái chạy thay đổi (isRunning: boolean)
 *   onOutputReady  - Callback khi có output hoàn chỉnh (cho AI grading)
 *   onInputCollected - Callback thu thập input user đã nhập (cho AI grading)
 *
 * Methods (qua ref):
 *   startExecution(code) - Bắt đầu chạy code
 *   stopExecution()      - Dừng chương trình
 *   clearTerminal()      - Xóa nội dung terminal
 */
const InteractiveTerminal = forwardRef(
  ({ wsUrl, onRunStateChange, onOutputReady, onInputCollected }, ref) => {
    const [isConnected, setIsConnected] = useState(false);

    // Refs
    const wsRef = useRef(null);
    const termRef = useRef(null);
    const termContainerRef = useRef(null);
    const fitAddonRef = useRef(null);
    const waitingInputRef = useRef(false);
    const inputBufferRef = useRef("");
    const collectedInputs = useRef([]);
    const fullOutput = useRef("");
    const isRunningRef = useRef(false);

    // ============================================================
    // Khởi tạo xterm.js Terminal (chỉ 1 lần khi mount)
    // ============================================================
    useEffect(() => {
      const term = new Terminal({
        theme: {
          background: "#0b0b0b",
          foreground: "#00ff88",
          cursor: "#00ff88",
          cursorAccent: "#0b0b0b",
          selectionBackground: "rgba(0, 255, 136, 0.25)",
        },
        fontFamily: '"Courier New", Consolas, "Liberation Mono", monospace',
        fontSize: 14,
        lineHeight: 1.2,
        cursorBlink: true,
        cursorStyle: "block",
        disableStdin: true, // Mặc định tắt input, bật khi có input_request
        convertEol: true, // \n -> \r\n
        scrollback: 1000,
        allowProposedApi: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termContainerRef.current);

      // Fit sau khi mount (dùng requestAnimationFrame để đảm bảo DOM sẵn sàng)
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          // Bỏ qua lỗi fit khi container chưa có kích thước
        }
      });

      termRef.current = term;
      fitAddonRef.current = fitAddon;



      // Xử lý input từ user (xterm.js gọi callback này khi user gõ phím)
      term.onData((data) => {
        if (!waitingInputRef.current) return;

        if (data === "\r") {
          // Enter key -> gửi input
          term.write("\r\n");
          const inputValue = inputBufferRef.current;

          // Gửi qua WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "input", data: inputValue })
            );
          }

          collectedInputs.current.push(inputValue);
          fullOutput.current += inputValue + "\n";
          inputBufferRef.current = "";
          waitingInputRef.current = false;
          term.options.disableStdin = true;
        } else if (data === "\x7f" || data === "\b") {
          // Backspace
          if (inputBufferRef.current.length > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1);
            term.write("\b \b"); // Xóa ký tự trên terminal
          }
        } else if (data === "\x03") {
          // Ctrl+C -> dừng chương trình
          stopExecution();
        } else if (data >= " " || data === "\t") {
          // Ký tự in được
          inputBufferRef.current += data;
          term.write(data); // Echo ký tự (xterm.js không tự echo)
        }
      });

      // ResizeObserver để fit terminal khi container thay đổi kích thước
      const container = termContainerRef.current;
      const ro = new ResizeObserver(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          // Bỏ qua lỗi fit
        }
      });
      if (container) {
        ro.observe(container);
      }

      return () => {
        ro.disconnect();
        term.dispose();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================================
    // WebSocket: Bắt đầu chạy code
    // ============================================================
    const startExecution = useCallback(
      (code) => {
        if (!code || !wsUrl) return;

        // Reset state
        waitingInputRef.current = false;
        inputBufferRef.current = "";
        collectedInputs.current = [];
        fullOutput.current = "";
        isRunningRef.current = true;

        // Clear terminal
        const term = termRef.current;
        if (term) {
          term.clear();
        }

        // Đóng WS cũ nếu còn
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            // Bỏ qua
          }
          wsRef.current = null;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          ws.send(JSON.stringify({ type: "start", code }));
          onRunStateChange?.(true);
        };

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          const t = termRef.current;
          if (!t) return;

          switch (msg.type) {
            case "stdout":
              t.write(msg.data); // Ghi output ra terminal (xterm xử lý \n, ANSI, v.v.)
              fullOutput.current += msg.data;
              break;

            case "input_request":
              waitingInputRef.current = true;
              inputBufferRef.current = "";
              t.options.disableStdin = false; // Bật input
              t.focus(); // Focus để user gõ được ngay
              break;

            case "done":
              isRunningRef.current = false;
              t.write(
                "\r\n\x1b[90m--- Chương trình kết thúc ---\x1b[0m\r\n"
              );
              t.options.disableStdin = true;
              onRunStateChange?.(false);
              onOutputReady?.(msg.output || fullOutput.current);
              onInputCollected?.(collectedInputs.current.join("\n"));
              break;

            case "error":
              isRunningRef.current = false;
              // Hiển thị lỗi màu đỏ
              t.write(`\r\n\x1b[31m${msg.data}\x1b[0m\r\n`);
              t.options.disableStdin = true;
              onRunStateChange?.(false);
              onOutputReady?.(msg.output || fullOutput.current);
              onInputCollected?.(collectedInputs.current.join("\n"));
              break;

            default:
              break;
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          if (isRunningRef.current) {
            isRunningRef.current = false;
            onRunStateChange?.(false);
          }
        };

        ws.onerror = () => {
          const t = termRef.current;
          if (t) {
            t.write(
              "\r\n\x1b[31m Lỗi kết nối WebSocket. Vui lòng thử lại.\x1b[0m\r\n"
            );
          }
          isRunningRef.current = false;
          onRunStateChange?.(false);
        };
      },
      [wsUrl, onRunStateChange, onOutputReady, onInputCollected]
    );

    // ============================================================
    // Dừng chương trình
    // ============================================================
    const stopExecution = useCallback(() => {
      if (wsRef.current) {
        try {
          // Gửi stop message trước khi đóng
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "stop" }));
          }
          wsRef.current.close();
        } catch (e) {
          // Bỏ qua
        }
        wsRef.current = null;
      }

      waitingInputRef.current = false;
      isRunningRef.current = false;

      const term = termRef.current;
      if (term) {
        term.options.disableStdin = true;
      }

      onRunStateChange?.(false);
    }, [onRunStateChange]);

    // ============================================================
    // Xóa terminal
    // ============================================================
    const clearTerminal = useCallback(() => {
      const term = termRef.current;
      if (term) {
        term.clear();
      }
    }, []);

    // ============================================================
    // Re-fit terminal (gọi khi tab chuyển về visible)
    // ============================================================
    const refit = useCallback(() => {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit();
        } catch (e) {
          // Bỏ qua lỗi fit
        }
      });
    }, []);

    // ============================================================
    // Expose methods cho parent qua ref
    // ============================================================
    useImperativeHandle(
      ref,
      () => ({
        startExecution,
        stopExecution,
        clearTerminal,
        refit,
      }),
      [startExecution, stopExecution, clearTerminal, refit]
    );

    // ============================================================
    // Cleanup WebSocket khi unmount
    // ============================================================
    useEffect(() => {
      return () => {
        if (wsRef.current) {
          try {
            wsRef.current.close();
          } catch (e) {
            // Bỏ qua
          }
          wsRef.current = null;
        }
      };
    }, []);

    return (
      <div className={`interactive-terminal-wrapper${isConnected ? " connected" : ""}`}>
        <div ref={termContainerRef} className="interactive-terminal" />
      </div>
    );
  }
);

InteractiveTerminal.displayName = "InteractiveTerminal";

export default React.memo(InteractiveTerminal);
