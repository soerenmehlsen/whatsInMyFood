import { Fade } from "./ui/fade";
import ResponsiveImage from "./responsiveImage";
import TryNow from "./SignUpButton";

const trustPoints = ["Free to use", "No sign-up needed", "Results in seconds"];

const CheckIcon = () => (
    <svg className="h-4 w-4 flex-none text-blue-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m5 10.5 3.5 3.5L15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const HeroSection = () => {
    return (
        <section className="relative overflow-hidden pt-2 text-center sm:pt-10">
            {/* Background atmosphere */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="hero-grid absolute inset-x-0 top-0 h-[620px]" />
                <div className="absolute left-1/2 top-[-140px] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-blue-300/25 blur-[130px]" />
            </div>

            <div className="mx-auto max-w-3xl px-4">
                {/* Eyebrow / trust badge */}
                <Fade delay={250} direction="up">
                    <div className="flex justify-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-1.5 text-sm font-medium text-blue-700 backdrop-blur">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                            </span>
                            AI-powered ingredient analysis
                        </span>
                    </div>
                </Fade>

                {/* Headline */}
                <Fade delay={400} direction="up">
                    <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
                        Understand your{" "}
                        <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
                            food ingredients
                        </span>{" "}
                        with AI
                    </h1>
                </Fade>

                {/* Subhead */}
                <Fade delay={550} direction="up">
                    <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-500">
                        Take a picture of your food&apos;s ingredient list and let AI break down
                        each ingredient — so you always know exactly what you&apos;re eating.
                    </p>
                </Fade>

                {/* CTAs */}
                <Fade delay={650} direction="up">
                    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <TryNow buttonText="Try now" />
                        <a
                            href="#how-it-works"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-7 py-3.5 text-lg font-semibold text-zinc-700 backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700">
                            See how it works
                        </a>
                    </div>
                </Fade>

                {/* Trust row */}
                <Fade delay={750} direction="up">
                    <ul className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
                        {trustPoints.map((point) => (
                            <li key={point} className="inline-flex items-center gap-1.5">
                                <CheckIcon />
                                {point}
                            </li>
                        ))}
                    </ul>
                </Fade>
            </div>

            {/* Product image with blue glow */}
            <div className="relative mt-14 flex justify-center sm:mt-20">
                <div
                    aria-hidden
                    className="absolute left-1/2 top-12 -z-10 h-[55%] w-[80%] max-w-4xl -translate-x-1/2 rounded-[40%] bg-blue-200/40 blur-[110px]"
                />
                <Fade delay={850} direction="up">
                    <ResponsiveImage />
                </Fade>
            </div>
        </section>
    );
};

export default HeroSection;
