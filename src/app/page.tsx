import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center h-screen">
      <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
        Tech Health
        <br />
        Appendix Generator
      </h2>
      <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
        Analyze your GitHub repository and instantly generate an investor-ready
        tech health appendix with key metrics and actionable insights. Paste
        your GitHub repo URL to get a tech health report with metrics,
        benchmarks, and improvement suggestions.
      </p>
      <div className="container flex gap-3 items-center justify-center">
        <Input
          className="w-1/2 md:w-1/2 mt-4"
          placeholder="https://github.com/owner/repo"
        />
        <Button className="mt-4">Generate Report</Button>
      </div>
    </main>
  );
}
