import Image from "next/image";
import heroImage from "@/public/Iphones.png";

const ResponsiveImage = () => {
    return (
        <Image
            src={heroImage}
            alt="Hero section image"
            priority
            placeholder="blur"
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 80vw, 1200px"
            className="h-auto w-full max-w-5xl"
        />
    );
};

export default ResponsiveImage;