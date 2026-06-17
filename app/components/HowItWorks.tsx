import { Fade } from "react-awesome-reveal"

const HowItWorks = () => {

    const steps = [
        {
            number: 1,
            title: "Scan or snap",
            description: "Scan a product's barcode, or take a picture of the ingredient list.",
        },
        {
            number: 2,
            title: "Let AI read it",
            description: "We pull the ingredients and analyze each one with AI.",
        },
        {
            number: 3,
            title: "Get the results",
            description: "You will get a detailed breakdown of each ingredient and how processed it is.",
        },
    ];

    return (
        <div id="how-it-works" className="scroll-mt-24">
            <Fade direction="up" delay={300} cascade damping={0.1} triggerOnce={true}>
                <div className="mt-20 flex justify-center sm:mt-36">
                    <span className="inline-flex items-center rounded-full border border-[#34c759]/40 bg-[#34c759]/10 px-4 py-1.5 text-sm font-medium text-accent-fg">
                        How it works
                    </span>
                </div>

                <h2 className="mt-6 text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                    Three steps to{" "}
                    <span className="bg-gradient-to-r from-[#1a8f3c] to-[#34c759] bg-clip-text text-transparent">
                        better choices
                    </span>
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-balance text-lg text-zinc-500">
                    From a quick snapshot to a full ingredient breakdown — in seconds.
                </p>

                <div className="mx-auto mt-16 grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
                    {steps.map((step) => (
                        <div
                            key={step.number}
                            className="group relative rounded-2xl border border-zinc-100 bg-white/60 p-8 shadow-sm ring-1 ring-zinc-900/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-[#34c759]/40 hover:shadow-md">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a8f3c] to-[#34c759] text-xl font-bold text-white shadow-lg shadow-[#34c759]/20 transition-transform duration-300 group-hover:scale-105">
                                {step.number}
                            </div>
                            <h3 className="mt-6 text-xl font-bold text-zinc-900">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-zinc-500">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </Fade>
        </div>
    );
}

export default HowItWorks;
