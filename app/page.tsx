import Hero from "@/components/Hero";
import About from "@/components/sections/About/About";
import Services from "@/components/sections/Services/Services";
import HowItWorks from "@/components/sections/HowItWorks/HowItWorks";
import Faq from "@/components/sections/Faq/Faq";
import Cta from "@/components/sections/Cta/Cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <HowItWorks />
      <Faq />
      <Cta />
    </>
  );
}
