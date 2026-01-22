import {
  HeroSection,
  ProblemSection,
  SolutionSection,
  ValueSection,
  VisionSection,
  CTASection,
} from "@/components/sections";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <ValueSection />
        <VisionSection />
        <CTASection />
      </main>
    </>
  );
}
