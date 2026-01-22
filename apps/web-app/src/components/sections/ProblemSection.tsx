"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const problems = [
  {
    title: "質問するのが怖い",
    description: "「こんなことも知らないの？」と思われたくない。叩かれたくない。恥ずかしい。",
    icon: "😰",
  },
  {
    title: "既存のQ&Aは荒れやすい",
    description: "マウント文化、攻撃的な回答、初心者お断りの雰囲気。",
    icon: "🔥",
  },
  {
    title: "AIは嘘をつく",
    description: "ChatGPTは速いけど、ハルシネーション。本当に正しいかわからない。",
    icon: "🤖",
  },
];

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="problem" className="section bg-[var(--color-secondary)]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-4"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          今、<span className="text-gradient">何が問題</span>なのか
        </motion.h2>

        <motion.p
          className="text-xl text-gray-400 text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          知りたいことがあるのに、聞けない。聞いても、信じられない。
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.title}
              className="card text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
            >
              <div className="text-5xl mb-4">{problem.icon}</div>
              <h3 className="text-xl font-bold mb-3">{problem.title}</h3>
              <p className="text-gray-400">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
