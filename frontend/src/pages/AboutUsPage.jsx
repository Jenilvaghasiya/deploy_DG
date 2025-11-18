import { useEffect, useState } from "react";
import { fetchStrapiContent } from '../utils/axiosUtils';

export default function AboutUsPage() {
	const [aboutData, setAboutData] = useState(null);

    useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetchStrapiContent("about-us?populate=*"); // 'about' should be your Strapi collection type slug
                
                if (res) {
					const item = res;                    
					setAboutData({
						title: item.title || "About Us",
						subTitle: item.subTitle || "",
						sectionTitle: item.sectionTitle || "",
						descShort: item.descriptionShort || "",
						descLong: item.descriptionLong || "",
						imageUrl: item.image?.url || null,
					});
				}
			} catch (err) {
				console.error("Error loading About data", err);
			}
		};
		fetchData();
	}, []);

	if (!aboutData) {
		return <div className="text-white text-center pt-32">Loading...</div>;
	}
	return (
		<div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
			<div className='overflow-auto flex flex-col h-96 grow'>
				<div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
					<div className="container px-4 mx-auto text-center">
						<h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">About us</h1>
                            <p className="text-base text-white max-w-4xl w-full mx-auto">{aboutData.subTitle}</p>
					</div>
				</div>
				<div className='xl:px-0 px-4 flex flex-col h-96 grow'>
					<div className="container w-full mx-auto p-4 2xl:p-6 border-shadow-blur border border-solid border-white/30 rounded-2xl relative z-10 lg:flex lg:flex-col lg:h-96 lg:grow lg:overflow-auto custom-scroll">
						<div className="flex flex-wrap items-center gap-4 lg:h-24 lg:grow">
							<div className="lg:w-5/12 grow lg:px-4">
								<div className='w-full relative after:pt-[56%] 2xl:after:pt-[70%] after:block after:w-full rounded-xl overflow-hidden'>
									<img src={aboutData.imageUrl} alt="About Us" className="absolute top-0 left-0 w-full h-full object-cover rounded-lg" />
								</div>
							</div>
							<div className="lg:w-5/12 grow lg:p-4 2xl:p-6 [&>*]:text-white [&>*]:mb-4 px-4 lg:border-l border-solid border-white/30">
								<h2 className="text-xl xl:text-3xl leading-normal xl:leading-tight font-bold">{aboutData.sectionTitle}</h2>
								<p className='text-sm lg:text-base'>{aboutData.descShort}</p>
								<p className='text-sm lg:text-base'>{aboutData.descLong}</p>
								<a href="/contact-us" className='bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center py-2 px-4 rounded-xl w-fit font-medium hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 transition-all duration-200 ease-linear'>Contact Us</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
