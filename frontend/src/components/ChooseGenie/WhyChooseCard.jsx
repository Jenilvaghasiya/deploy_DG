import ReactMarkdown from "react-markdown";

export const WhyChooseCard = ({ card, index }) => {
  if (!card) return null;

  const isReversed = index % 2 !== 0;
  const content = card.content || "";

  return (
    <div
      className={`w-full flex md:flex-row flex-col items-center justify-center ${
        isReversed ? "md:flex-row-reverse" : ""
      }`}
    >
      {/* Card content */}
      <div
        className={`w-full flex ${
          isReversed ? "md:justify-start" : "md:justify-end"
        } justify-center px-8 md:px-0`}
      >
        <div className="w-[30rem] relative md:px-10 px-5 py-10 rounded-2xl text-white dg-testimonial-card border-2 lg:border-4 border-solid border-white">
          <h1 className="font-bold text-3xl mb-6">{card.title || ""}</h1>
          <div className="prose prose-invert text-white text-xl max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center">
        {card?.image?.url && (
          <img
            src={`${import.meta.env.VITE_STRAPI_URL}${card.image.url}`}
            alt={card.title || "Card image"}
          />
        )}
      </div>
    </div>
  );
};
