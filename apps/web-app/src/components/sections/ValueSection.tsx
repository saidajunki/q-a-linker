"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const askerValues = [
  { icon: "🎯", title: "敷居が低い", description: "雑に質問してOK。恥ずかしくない。" },
  { icon: "✅", title: "確実な情報", description: "人間が検証。速度より確実性。" },
  { icon: "🌍", title: "多角的な視点", description: "複数の回答を統合。偏りが少ない。" },
];

const responderValues = [
  { icon: "🧠", title: "言葉が難しくてもOK", description: "AIが翻訳。専門用語で答えられる。" },
  { icon: "🤝", title: "社会参画", description: "コミュニティに所属していなくても貢献できる。" },
  { icon: "📈", title: "成長できる", description: "教えることで自分も学ぶ。" },
];

export function ValueSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section bg-[var(--color-secondary)]" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-4xl md:text-5xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-gradient">誰もが</span>恩恵を受ける
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12">
          {/* 質問者向け */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-center">
              <span className="text-blue-400">質問者</span>へ
            </h3>
            <div className="space-y-4">
              {askerValues.map((value, index) => (
                <motion.div
                  key={value.title}
                  className="card flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <span className="text-3xl">{value.icon}</span>
                  <div>
                    <h4 className="font-bold mb-1">{value.title}</h4>
                    <p className="text-gray-400 text-sm">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 回答者向け */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold mb-6 text-center">
              <span className="text-green-400">回答者</span>へ
            </h3>
            <div className="space-y-4">
              {responderValues.map((value, index) => (
                <motion.div
                  key={value.title}
                  className="card flex items-start gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <span className="text-3xl">{value.icon}</span>
                  <div>
                    <h4 className="font-bold mb-1">{value.title}</h4>
                    <p className="text-gray-400 text-sm">{value.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
