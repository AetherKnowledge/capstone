import Hero from "./components/Hero";
import About from "./components/Hero/About";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-base-100 text-base-content gap-10">
      <Hero />
      <About />
    </div>
  );
}
