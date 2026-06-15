import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import WhyItMatters from "./components/WhyItMatters";
import TryNow from "./components/SignUpButton";

export default async function Home() {
  //const { userId } = await auth();

  /*
  if (userId) {
    redirect("/dashboard");
  }*/

  return (
    <>
      < HeroSection />

      <div className="container text-center px-4 pb-8 mx-auto">
        < HowItWorks />
        < WhyItMatters />

        <section className="relative mx-auto mt-24 max-w-4xl overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 px-6 py-16 sm:mt-36 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-[420px] -translate-x-1/2 rounded-full bg-blue-300/30 blur-[100px]"
          />
          <h2 className="relative text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Ready to see what&apos;s in your food?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-balance text-lg text-zinc-600">
            Snap a photo and get an instant, AI-powered ingredient breakdown — completely free.
          </p>
          <div className="relative mt-8 flex justify-center">
            <TryNow buttonText="Get Started" />
          </div>
        </section>
      </div>
    </>
  );
}
