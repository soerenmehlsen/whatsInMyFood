import ArticleShowcase from "./articleShowcase";
import { Fade } from "react-awesome-reveal"

const WhyItMatters = () => {
  return (
      <Fade direction="up" delay={300} cascade damping={0.1} triggerOnce={true}>
          <div className="mt-20 flex justify-center sm:mt-36">
              <span className="inline-flex items-center rounded-full border border-[#34c759]/40 bg-[#34c759]/10 px-4 py-1.5 text-sm font-medium text-accent-fg">
                  Why it matters
              </span>
          </div>

          <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Know what&apos;s{" "}
              <span className="bg-gradient-to-r from-[#1a8f3c] to-[#34c759] bg-clip-text text-transparent">
                  really
              </span>{" "}
              in your food
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-zinc-500">
              Understanding the ingredients in your food is key to making informed dietary
              choices and maintaining a healthy lifestyle.
          </p>

          <div className="mt-10 flex justify-center sm:mt-16">
              <ArticleShowcase />
          </div>
      </Fade>
  );
}

export default WhyItMatters;
