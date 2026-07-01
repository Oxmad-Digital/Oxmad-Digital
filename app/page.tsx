import Hero from "@/components/Hero";
import LogosBand from "@/components/LogosBand";
import About from "@/components/sections/About/About";
import Services from "@/components/sections/Services/Services";
import Realisations from "@/components/sections/Realisations/Realisations";
import Process from "@/components/sections/Process/Process";
import Cta from "@/components/sections/Cta/Cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <LogosBand />
      <About />
      <Services />
      <Realisations />
      <Process />
      <Cta />
    </>
  );
}
