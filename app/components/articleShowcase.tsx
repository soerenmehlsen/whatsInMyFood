"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ArticleCard from './ArticleCard';
import { posts} from '@/lib/consant';



export default function ArticleShowcase() {
    const [current, setCurrent] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    const next = () => setCurrent((curr) => (curr + 1) % posts.length);
    const prev = () => setCurrent((curr) => (curr - 1 + posts.length) % posts.length);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('da-DK', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-4 overflow-hidden">
            <div className="relative ">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${current * (isMobile ? 100 : 33.33)}%)` }}
                >
                    {posts.map((article, index) => (
                        <div
                            key={index}
                            className="w-full sm:w-1/3 flex-shrink-0 px-2 transition-all duration-500"
                            style={{
                                transform: `scale(${index === current ? 1 : 0.9})`,
                                opacity: index === current ? 1 : 0.7
                            }}
                        >
                            {article.link.startsWith('http') ? (
                                <a href={article.link} target="_blank" rel="noopener noreferrer" className="block">
                                    <ArticleCard article={article} formatDate={formatDate} />
                                </a>
                            ) : (
                                <Link href={article.link} className="block">
                                    <ArticleCard article={article} formatDate={formatDate} />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-5">
                <button
                    onClick={prev}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-95"
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    {posts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrent(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            aria-current={index === current}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                index === current
                                    ? 'w-6 bg-blue-500'
                                    : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                            }`}
                        />
                    ))}
                </div>

                <button
                    onClick={next}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md active:scale-95"
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
