import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export interface RevealProps {
  children: React.ReactNode;
  from?: "left" | "right" | "bottom" | "top";
  delay?: number;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  from = "bottom",
  delay = 0,
}) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  const variants = {
    hidden: {
      opacity: 0,
      x: from === "left" ? -100 : from === "right" ? 100 : 0,
      y: from === "bottom" ? 50 : from === "top" ? -50 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
    >
      {children}
    </motion.div>
  );
};
