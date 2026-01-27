"use client"
import Link from "next/link";
import Image from "next/image";
//import { UserButton, SignedOut, SignInButton, SignUpButton, SignedIn} from '@clerk/nextjs'
import  React, { useState, useEffect } from 'react';

export function Header() {
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
  return (
    <header className=" bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className={`flex items-center justify-between ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="/whatsinmyfood-logo.png" 
              alt="What's in my food logo" 
              width={32} 
              height={32} 
              className="h-8 w-8" 
            />
            <span className="text-xl font-bold text-gray-800 sm:text-2xl">
              What&apos;s in my food?
            </span>
          </Link>

  {/*         <SignedOut>
            <div className="flex space-x-2">
              <SignInButton>
                <button
                    className="bg-white hover:bg-gray-200 text-black font-semibold rounded-3xl border transition-colors duration-200 px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base">
                  Login
                </button>
              </SignInButton>
              <SignUpButton>
                <button
                    className="bg-black hover:bg-gray-500 text-white font-semibold rounded-3xl transition-colors duration-200 px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <UserButton
                showName={!isMobile}
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
            />
          </SignedIn>
        </div>
      </div>
      <SignedOut> */}
            </div>
            </div>
    </header>
  );
}
