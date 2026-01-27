//import { SignUpButton } from "@clerk/nextjs";

interface AnnouncementBannerProps {
    message: string;
    linkText?: string;
  }
  
  export default function AnnouncementBanner({ 
    message, 
    linkText, 
  }: AnnouncementBannerProps) {
    return ( 
       <div className="bg-indigo-600 px-4 py-3 text-white">
        <p className="text-center text-sm font-medium">
          {message}
          {linkText && (
            <button className="inline-block underline ml-1">
              {linkText}
            </button>
        )}
        </p>
      </div>

     /*  <div className="bg-indigo-600 px-4 py-3 text-white">
        <p className="text-center text-sm font-medium">
          {message}
          {linkText && (
          <SignUpButton mode="modal">
            <button className="inline-block underline ml-1">
              {linkText}
            </button>
          </SignUpButton>
        )}
        </p>
      </div> */
    );
  }