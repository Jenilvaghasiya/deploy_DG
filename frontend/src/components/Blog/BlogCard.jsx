const CHAR_LIMIT = 350;

function extractFirstMarkdownImage(markdown = "") {
  const match = markdown.match(/!\[.*?\]\((.*?)\)/);
  return match?.[1] || null;
}

export const BlogCard = ({ blog, index }) => {
  const isReversed = index % 2 !== 0;

  const fallbackImage = extractFirstMarkdownImage(blog.content);
 const imageUrl = blog?.coverImage?.url
  ? `${import.meta.env.VITE_STRAPI_URL.replace(/\/$/, "")}${blog.coverImage.url}`
  : fallbackImage;

  const truncatedContent =
    blog.content.length > CHAR_LIMIT
      ? blog.content.slice(0, CHAR_LIMIT) + "..."
      : blog.content;

  return (
    <div
      className={`flex flex-col md:flex-row ${
        isReversed ? "md:flex-row-reverse" : ""
      } items-center justify-center gap-10`}
    >
      {imageUrl && (
        <div className="dg-testimonial-card border-2 lg:border-4 border-solid border-whitey w-full max-w-md text-white mx-auto rounded-3xl flex flex-col p-4 lg:p-6">
          <img
            src={imageUrl}
            alt={blog.title}
            className="h-80 w-full rounded-3xl object-cover"
          />
        </div>
      )}
      <div className="dg-testimonial-card border-2 lg:border-4 border-solid border-whitey w-full max-w-md text-white mx-auto rounded-3xl flex flex-col justify-between p-4 lg:p-10">
        <div className="lg:h-72">
          <h3 className="mb-4 font-light text-xl lg:text-2xl">{blog.title}</h3>
          <p
            className="text-base lg:text-lg overflow-hidden mb-4 w-full"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 6,
              overflow: "hidden",
            }}
          >
            {truncatedContent}
          </p>
          <a
            className="mt-1 self-start rounded-full bg-gray-500 px-6 py-1 text-sm font-medium backdrop-blur"
            href={`/blog/${blog.slug}`}
          >
            Read more
          </a>
        </div>
      </div>
    </div>
  );
};
