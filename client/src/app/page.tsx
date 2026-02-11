import { Header } from "@/components/landing/header";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { FeaturesSection } from "@/components/landing/features-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ComparisonSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
