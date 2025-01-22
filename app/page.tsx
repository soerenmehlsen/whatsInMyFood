import { Fade } from "./components/ui/fade";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {SignedOut, SignUpButton} from "@clerk/nextjs";
import Image from 'next/image'

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
      <div className="container text-center px-4 py-8 max-w-full mx-auto">
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

        <SignedOut>
          <div className="flex justify-center">
            <SignUpButton>
              <Fade delay={600} direction="up">
                <button
                    className="bg-black hover:bg-gray-500 text-white text-xl font-bold py-3 px-12 rounded-3xl transition-colors duration-200 mb-10">
                  Sign Up
                </button>
              </Fade>
            </SignUpButton>
          </div>
        </SignedOut>

        <div className="flex justify-center sm:mt-20 mt-2">
            <Fade delay={600} direction="up">
            <Image
                src="/Iphones.png"    
                alt="Hero section image"
                width={700}             
                height={900}             
                priority                
            />
            </Fade>
        </div>
          
          <div>
            <Fade delay={600} direction="up">
              <h1 className="mb-6 sm:mt-20 mt-10 text-balance text-4xl font-bold text-zinc-800">
                Here's how it works
              </h1>
            </Fade>
          </div>
          
            <div className="max-w-7xl mx-auto flex flex-wrap justify-center mb-6 sm:mt-20 mt-10">
                <div className="w-full sm:w-1/3 px-4">
                <Fade delay={600} direction="up">
                    <div className="flex flex-col items-center sm:mt-2 mt-10">
                        <h1 className="text-2xl font-bold text-white mb-4 bg-black rounded-full w-12 h-12 flex items-center justify-center">
                            1
                        </h1>
                    <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                        Take a picture
                    </h2>
                    <p className="text-gray-500">
                        Take a picture of your food&apos;s ingredient list.
                    </p>
                    </div>
                </Fade>
                </div>
                <div className="w-full sm:w-1/3 px-4">
                <Fade delay={600} direction="up">
                    <div className="flex flex-col items-center sm:mt-2 mt-10">
                        <h1 className="text-2xl font-bold text-white mb-4 bg-black rounded-full w-12 h-12 flex items-center justify-center">
                            2
                        </h1>
                        <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                            Process the image
                        </h2>
                        <p className="text-gray-500">
                            The AI will scan the image and find the ingredients.
                        </p>
                    </div>
                </Fade>
                </div>
                <div className="w-full sm:w-1/3 px-4">
                    <Fade delay={600} direction="up">
                        <div className="flex flex-col items-center sm:mt-2 mt-10">
                            <h1 className="text-2xl font-bold text-white mb-4 bg-black rounded-full w-12 h-12 flex items-center justify-center">
                                3
                            </h1>
                            <h2 className="text-2xl font-bold text-zinc-800 mb-4">
                                Get the results
                            </h2>
                            <p className="text-gray-500">
                                You will get a detailed breakdown of each ingredient and how processed it is.
                            </p>
                        </div>
                    </Fade>
                </div>
            </div>

          <SignedOut>
              <div className="flex justify-center mt-20">
                  <SignUpButton>
                      <Fade delay={600} direction="up">
                          <button
                              className="bg-black hover:bg-gray-500 text-white text-xl font-bold py-3 px-12 rounded-3xl transition-colors duration-200 mb-10">
                              Start now
                          </button>
                      </Fade>
                  </SignUpButton>
              </div>
          </SignedOut>

      </div>
  );
}
