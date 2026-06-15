import Image from "next/image";
import heroImage from "@/public/Iphones.png";

const ResponsiveImage = () => {
    return (
        <Image
            src={heroImage}
            alt="Hero section image"
            priority
            placeholder="blur"
            sizes="(max-width: 640px) 96vw, (max-width: 1024px) 90vw, 1280px"
            className="h-auto w-full max-w-7xl"
        />
    );
};

export default ResponsiveImage;