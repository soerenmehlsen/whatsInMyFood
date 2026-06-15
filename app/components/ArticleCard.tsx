import Image from "next/image";

interface article {
    date: string;
    title: string;
    content: string;
    Image: string;
    link: string;
    logo: string;
}

const ArticleCard = ({ article, formatDate }: { article: article, formatDate: (date: string) => string }) => (
    <article className="group relative text-left overflow-hidden rounded-2xl shadow-sm ring-1 ring-zinc-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full max-w-sm md:max-w-md lg:max-w-lg mx-auto sm:h-96 h-72">
        <div className="aspect-w-16 aspect-h-9 w-full">
            <Image
                src={article.Image}
                alt="Article image"
                width={1024}
                height={768}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
        </div>

        <div className="relative h-full w-full bg-gradient-to-t from-gray-900/80 via-gray-900/50 to-transparent p-4 md:p-6">
            <div className="flex flex-col h-full justify-end">
                <div className="flex absolute top-4 left-4">
                    <Image
                        src={article.logo}
                        alt="Logo"
                        width={280}
                        height={280}
                        className="w-8 h-8 rounded-full"
                    />
                </div>
                <time dateTime={article.date} className="block text-xs text-white/90 mb-2">
                    {formatDate(article.date)}
                </time>

                <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                    {article.title}
                </h3>

                <p className="line-clamp-3 text-sm md:text-base text-white/95">
                    {article.content}
                </p>
            </div>
        </div>
    </article>
);

export default ArticleCard;