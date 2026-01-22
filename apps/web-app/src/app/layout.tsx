import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QALinker - AIは仲介に徹し、人間が答える",
  description: "質問の敷居を下げ、専門家の言葉を翻訳し、複数の回答を統合する。速度より確実性。国境を越えて、世界中の知識で支え合う。",
  openGraph: {
    title: "QALinker - AIは仲介に徹し、人間が答える",
    description: "質問の敷居を下げ、専門家の言葉を翻訳し、複数の回答を統合する。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
