import { useEffect, useState } from 'react';
import { fetchStrapiContent } from '../utils/axiosUtils';

export default function HomeGalleryPage() {
	const [images, setImages] = useState([]);

    useEffect(() => {
		const fetchImages = async () => {
			try {
				const data = await fetchStrapiContent("gallary/?populate[images][fields][0]=url"); // Replace "gallery" with your actual endpoint
				// If response is a single object
				if (data && data?.images) {
					setImages(data?.images);
				}
			} catch (error) {
				console.error("Error loading gallery:", error);
			}
		};

		fetchImages();
	}, []);
	
	return (
		<div className="pb-8 min-h-screen bg-black text-white flex flex-col overflow-hidden relative dg-footer before:size-56 lg:before:size-80 xl:before:size-96 before:bg-no-repeat before:bg-cover before:absolute before:-top-56 before:-right-28 xl:before:right-10 after:size-56 lg:after:size-80 xl:after:size-96 after:bg-no-repeat after:bg-cover after:absolute after:-bottom-72 after:-left-20 bg-purple-vectore">
			<div className='overflow-auto flex flex-col h-96 grow'>
				<div className="md:min-h-64 w-full relative border-shadow-blur pt-32 pb-10 lg:pb-16 mb-10 border-b border-solid border-white/30">
					<div className="container px-4 mx-auto text-center">
						<h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-center mb-2">Gallery</h1>
						<p className="text-base text-white max-w-4xl w-full mx-auto">Welcome to Genie App — your one-stop platform for AI-powered creativity. We empower users to create, transform, and manage digital content effortlessly using the latest in artificial intelligence.</p>
					</div>
				</div>
				<div className='xl:px-0 px-4 flex flex-col h-96 grow'>
					<div className="container mx-auto p-6 border-shadow-blur border border-solid border-white/30 rounded-2xl relative z-10 lg:flex lg:flex-col lg:h-96 lg:grow lg:overflow-auto custom-scroll">
						{/* Grid Gallery */}
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{images.length > 0 ? (
								images.map((img, idx) => (
									<div
										key={img.id || idx}
										className="rounded-xl overflow-hidden shadow-lg border border-white/30 hover:scale-105 transition-transform duration-200"
									>
										<img
											src={img.url}
											alt={`Gallery Image ${idx + 1}`}
											className="w-full h-52 object-cover"
										/>
									</div>
								))
							) : (
								<p className="text-center col-span-full">No images found.</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
