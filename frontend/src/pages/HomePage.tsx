import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import HeroSection from "../sections/HeroSection";
import FeaturesSection from "../sections/FeaturesSection";
import TestimonialSection from "../sections/TestimonialSection";
import PricingSection from "../sections/PricingSection";
import ContactSection from "../sections/ContactSection";
import CTASection from "../sections/CTASection";

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    const target = (location.state as any)?.scrollTo;
    if (!target) return;

    const t = setTimeout(() => {
      const el = document.getElementById(target);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });

      window.history.replaceState({}, document.title);
    }, 100);

    return () => clearTimeout(t);
  }, [location.state]);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <TestimonialSection />
      <PricingSection />
      <ContactSection />
      <CTASection />
    </>
  );
}
