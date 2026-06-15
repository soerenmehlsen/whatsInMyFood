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
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-9 py-3.5 text-lg font-semibold text-white shadow-lg shadow-blue-900/10 ring-1 ring-zinc-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 hover:shadow-xl hover:shadow-blue-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:translate-y-0">
                {buttonText}
                <svg
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true">
                    <path d="M4 10h12m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
    );
}

export default TryNow;
