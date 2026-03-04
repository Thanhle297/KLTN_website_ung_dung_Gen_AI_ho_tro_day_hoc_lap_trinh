import confetti from "canvas-confetti";

/**
 * Bắn confetti chúc mừng khi trả lời đúng câu hỏi.
 * Hiệu ứng: 2 đợt confetti bắn từ 2 bên trái-phải.
 */
export default function fireConfetti() {
  const duration = 1500;
  const end = Date.now() + duration;

  const colors = [
    "#26ccff",
    "#a25afd",
    "#ff5e7e",
    "#88ff5a",
    "#fcff42",
    "#ffd700",
  ];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
