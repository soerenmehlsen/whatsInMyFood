"use client";
import { useRouter } from 'next/navigation';

const TryNow = ({buttonText = "Try now"}) => {
    const router = useRouter();

    const handleClick = () => {
        router.push('/dashboard');
    };

    return (
            <button
                onClick={handleClick}
                className="bg-black hover:bg-gray-500 text-white text-xl font-bold py-3 px-12 rounded-3xl transition-colors duration-200 mb-10">
                {buttonText}
            </button>
    );
}

export default TryNow;