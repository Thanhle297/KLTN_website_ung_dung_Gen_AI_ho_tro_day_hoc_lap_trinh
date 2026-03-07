// src/components/PageTransition.jsx
// Wrapper tái sử dụng cho hiệu ứng chuyển trang
// direction: 1 = tiến (slide từ phải sang trái), -1 = lùi (slide từ trái sang phải)

import React from "react";
import { motion } from "framer-motion";

// Khoảng cách slide (px)
const SLIDE_DISTANCE = 60;

function getVariants(direction) {
  return {
    initial: {
      opacity: 0,
      x: direction * SLIDE_DISTANCE,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.28,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      x: direction * -SLIDE_DISTANCE,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1],
      },
    },
  };
}

// direction: 1 (tiến, mặc định) hoặc -1 (lùi)
const PageTransition = React.memo(function PageTransition({
  children,
  direction = 1,
}) {
  const variants = getVariants(direction);

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
});

export default PageTransition;
