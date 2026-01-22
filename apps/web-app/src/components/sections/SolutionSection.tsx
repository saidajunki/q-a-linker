"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    step: "1",
    title: "雑に質問を投げる",
    description: "専門用語を知らなくてOK。LINEで友達に聞くように、気軽に質問。",
    color: "from-blue-500 to-cyan-500",
  },
  {
    step: "2",
    title: "AIが質問を整形",
    description: "AIが質問の意図を理解し、適切な回答者にマッチング。",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "3",
    title: "複数の人間が回答",
    description: "得意分野を持つ複数の回答者が、それぞれの視点で回答。",
    color: "from-orange-500 to-red-500",
  },
  {
    step: "4",
    title: "AIが統合・翻訳",
    description: "複数の回答を統合し、あなたのレベルに合わせて翻訳。",
    color: "from-green-500 to-emerald-500",
  },
];

export function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section bg-[var(--color-primary)]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-gradient">QALinker</span>の解決策
        </motion.h2>

        <motion.p
          className="text-xl text-gray-400 text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          人間をAIモデルのように使う。AIは仲介に徹する。
        </motion.p>

        <div className="relative">
          {/* 接続線 */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 -translate-x-1/2" />

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.15 }}
              >
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <div className="card">
                    <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>

                <div className={`hidden md:flex w-16 h-16 rounded-full bg-gradient-to-r ${step.color} items-center justify-center text-2xl font-bold z-10`}>
                  {step.step}
                </div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
