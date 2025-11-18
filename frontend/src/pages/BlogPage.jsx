import { useEffect, useState } from "react";
import { fetchStrapiContent } from "../utils/axiosUtils";
import { Link } from "react-router-dom";

function extractFirstMarkdownImage(markdown = "") {
  const match = markdown.match(/!\[.*?\]\((.*?)\)/);
  return match?.[1] || null;
}

export default function BlogPage() {
  const [blogPosts, setBlogData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      try {
        const res = await fetchStrapiContent("blogs?populate=coverImage");
        const posts =
          res?.map((item) => {
            const fallbackImage = extractFirstMarkdownImage(item.content);
            return {
              id: item.id,
              title: item.title,
              slug: item.slug,
              description: item.content?.substring(0, 100) + "...",
              image: item.coverImage?.url || fallbackImage,
              createdAt: item.createdAt,
            };
          }) || [];
        setBlogData(posts);
      } catch (err) {
        setError("Failed to load blog posts.");
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  if (!blogPosts) {
    return <div className="text-white text-center">Loading...</div>;
  }
  return (
    <div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
      <div className="overflow-auto flex flex-col h-96 grow relative z-10">
        <div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
          <div className="container px-4 mx-auto text-center">
            <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">
              Our Blog
            </h1>
            <p className="text-base text-white max-w-4xl w-full mx-auto">
              Welcome to Genie App — your one-stop platform for AI-powered
              creativity. We empower users to create, transform, and manage
              digital content effortlessly using the latest in artificial
              intelligence.
            </p>
          </div>
        </div>

        {error && <p className="text-red-500 text-center mb-6">{error}</p>}
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[...blogPosts]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((post) => {
                // Check if image path is relative (starts with "/")
                const isRelative = post.image && post.image.startsWith("/");
                const imageSrc = isRelative
                  ? `${import.meta.env.VITE_STRAPI_URL.replace(/\/$/, "")}${post.image}`
                  : post.image;
                return (
                  <div
                    key={post.id}
                    className="border-shadow-blur rounded-xl shadow-lg"
                  >
                    {post?.image && (
                      <img
                        src={imageSrc}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-gray-400 text-sm mb-4">{post.description}</p>
                      <Link to={`/blog/${post.slug}`}>
                        <button className="text-purple-400 text-sm hover:underline cursor-pointer">
                          Read More →
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
