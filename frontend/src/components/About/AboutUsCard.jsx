import { marked } from "marked";
export const AboutUsCard = ({ card = [] }) => {
  return (
    <>
      <div className="py-20 bg-black w-full flex flex-col">
        {
          card.map((item, index) => (
            <div key={item.id} className="overflow-x-clip w-full flex flex-col lg:flex-row lg:even:flex-row-reverse items-center group lg:gap-8 xl:gap-10 relative after:absolute after:blur-2xl after:rounded-full after:right-0 2xl:after:-right-40 after:left-auto odd:after:right-auto odd:after:left-0 2xl:odd:after:-left-40 after:top-1/6 lg:after:top-2/4 lg:after:-translate-y-2/4 2xl:after:size-80 after:size-48 after:scale-200 after:bg-[radial-gradient(circle,rgb(101,_0,_180)_0%,rgb(101,_0,_180)_100%)]">
              <div className="w-full xl:w-1/3 2xl:w-5/12 px-8 xl:px-10 bg-no-repeat group-even:bg-right bg-left bg-cover min-h-96 lg:min-h-[500px] flex flex-col justify-center relative before:size-full before:absolute before:inset-0 before:bg-[radial-gradient(58%_51%_at_50%_50%,_rgba(0,0,0,0)_0%,_#000000_100%)]" style={{ backgroundImage: `url(${item?.image?.url})` }}>
                <h2 className="text-3xl md:text-4xl lg:text-5xl relative z-[2] 2xl:text-7xl text-white leading-snug max-w-[550px] mx-auto w-full font-extralight [&>p>strong]:font-semibold" dangerouslySetInnerHTML={{ __html: marked.parse(item?.title || "")}}></h2>
              </div>
              <div className="w-[92%] xl:w-2/4 2xl:w-7/12 grow lg:m-0 group-even:ml-0 group-even:mr-auto ml-auto">
                <div className="p-8 lg:p-10 xl:p-16 2xl:pr-24 2xl:group-even:pl-24 2xl:group-even:pr-16 group-even:rounded-s-none group-even:rounded-e-3xl rounded-s-3xl 2xl:group-even:rounded-s-none 2xl:group-even:rounded-e-4xl 2xl:rounded-s-4xl border-shadow-blur w-full [&>p]:font-extralight [&>p>u>strong]:font-semibold [&>p>strong]:font-semibold text-base md:text-xl 2xl:text-2xl text-white [&>ul]:list-disc [&>ul]:pl-8" dangerouslySetInnerHTML={{ __html: marked.parse(item?.content || "") }}></div>
              </div>
            </div>
          ))
        }
      </div>
    </>
  );
};