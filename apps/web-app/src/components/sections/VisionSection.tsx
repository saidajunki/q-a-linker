"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function VisionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section gradient-bg relative overflow-hidden" ref={ref}>
      {/* 背景の地球イメージ（抽象的な円） */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full border border-white/10"
        style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full border border-white/10"
        style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* つながりを表す点 */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 250;
        return (
          <motion.div
            key={i}
            className="absolute w-3 h-3 bg-[var(--color-highlight)] rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * radius}px)`,
              top: `calc(50% + ${Math.sin(angle) * radius}px)`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        );
      })}

      <div className="max-w-4xl mx-auto text-center z-10 relative">
        <motion.h2
          className="text-4xl md:text-6xl font-bold mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gradient">究極のビジョン</span>
        </motion.h2>

        <motion.p
          className="text-2xl md:text-3xl font-light mb-8 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          どんな専門家がどこにいても、
          <br />
          世界中のみんなで支え合っていける。
        </motion.p>

        <motion.p
          className="text-xl text-gray-300 mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          国境を跨いで一つの課題に取り組み、
          <br />
          支え合って、みんな仲良く。
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span className="px-4 py-2 bg-white/5 rounded-full">🌏 グローバル・セカンドオピニオン</span>
          <span className="px-4 py-2 bg-white/5 rounded-full">🤝 国境を越えた協力</span>
          <span className="px-4 py-2 bg-white/5 rounded-full">📚 知識の民主化</span>
        </motion.div>
      </div>
    </section>
  );
}
