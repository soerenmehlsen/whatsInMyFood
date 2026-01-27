// import { SignedOut} from "@clerk/nextjs";
import { Fade } from "./ui/fade";
import ResponsiveImage from "./responsiveImage";
import TryNow from "./SignUpButton";
// import SignUp from "./SignUpButton";

const HeroSection = () => {
    return (
        <div>
            <Fade delay={400} direction="up">
                <div className="max-w-2xl text-center mx-auto sm:mt-20 mt-2">
                    <h1 className="mb-6 text-balance text-6xl font-bold text-zinc-800">
                        Understand your food ingredients with AI
                    </h1>
                </div>
            </Fade>

            <div className="max-w-3xl text-center mx-auto">
                <Fade delay={600} direction="up">
                    <p className="mb-8 text-lg text-gray-500 text-balance">
                        Take a picture of your food&apos;s ingredient list and let AI help
                        you understand each ingredient, so you know what you&apos;re eating.
                    </p>
                </Fade>
            </div>
            
            <div className="flex justify-center">
                <Fade delay={600} direction="up">
                <TryNow buttonText="Try now" />
                </Fade>
            </div>

            {/* <SignedOut>
                <div className="flex justify-center">
                    <Fade delay={600} direction="up">
                       <SignUp />
                    </Fade>
                </div>
            </SignedOut> */}

            <div className="flex justify-center sm:mt-20 mt-2">
                <Fade delay={600} direction="up">
                    <ResponsiveImage/>
                </Fade>
            </div>
        </div>
    );
}

export default HeroSection;
