
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import dgLogo from "../assets/images/dg-logo.png";
import { Header } from "../components/Common/Header/Header";
import folderIcon from "../assets/images/folder-icon.png";
import coinIcon from "../assets/images/coin-icon.png";
import woomenwearImg from "../assets/images/woomen-wear.jpg";
import addIcon from "../assets/images/add-projects.png";
import imgToTextIcon from "../assets/images/img-to-text.png";
import editImgIcon from "../assets/images/edit-img.png";
import DressVariationsGenerator from "../pages/DressVariationsGenerator";

export default function DashboardLayout({ children }) {
	const [openSidebar, setOpenSidebar] = useState(false);
	const { user } = useAuthStore();

	return (
		<>
			<div className="flex flex-row gap-3 md:gap-5 h-[100dvh] bg-black">
				<aside className={`bg-aside rounded-e-[50px] bg-white/5 flex flex-col shadow-[inset_0px_0px_30px_8px_rgba(255,255,255,0.25)] overflow-hidden transition-all duration-300 ease-linear ${openSidebar ? "w-96 p-5" : "w-20 p-2"}`}>
					<div className={`flex flex-col h-96 grow ${openSidebar ? "p-6" : "p-2 pt-16"}`}>
						<div className={`w-full flex items-center gap-3 ${openSidebar ? "justify-between" : "justify-center"}`}>
							<img src={dgLogo} className={`max-w-full h-auto w-2/4 grow transition-all duration-200 ease-linear ${openSidebar ? "block" : "hidden"}`} alt="logo" />
							<button onClick={() => setOpenSidebar(!openSidebar)} className="size-8 flex items-center justify-center p-0">
								<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-white">
									<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
								</svg>
							</button>
						</div>
						<nav className={`select-none whitespace-nowrap pt-10 overflow-auto overflow-x-hidden h-96 grow custom-scroll pr-2 transition delay-700 duration-300 ease-in-out`}>
							<ul className={`${openSidebar ? "block" : "hidden"}`}>
								<li className="mb-5">
									<span className="block text-2xl font-medium text-white mb-2">AI Design Lab</span>
									<ul className="pl-4">
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Dress Variation</a>
										</li>
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Text to Image</a>
										</li>
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Text to Image</a>
										</li>
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Text to Image</a>
										</li>
									</ul>
								</li>
								<li className="mb-5">
									<span className="block text-2xl font-medium text-white mb-2">Workspace</span>
									<ul className="pl-5">
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Projects</a>
										</li>
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Images</a>
										</li>
										<li>
											<a href="#" className="text-white text-xl leading-normal block w-full p-1.5 px-4 rounded-lg transition-all duration-200 ease-linear">Text to Image</a>
										</li>
									</ul>
								</li>
								<li className="mb-5">
									<a href="#" className=" text-2xl font-medium text-white mb-2">Miscellaneous</a>
								</li>
							</ul>
							<ul className={`flex-col items-center gap-6 ${openSidebar ? "hidden" : "flex"}`}>
								<li>
									<button className="size-10 appearance-none bg-transparent">
										<img src={addIcon} className="size-full" alt="Add projects" />
									</button>
								</li>
								<li>
									<button className="size-10 appearance-none bg-transparent">
										<img src={folderIcon} className="w-9 block" alt="Project" />
									</button>
								</li>
								<li>
									<button className="size-10 appearance-none bg-transparent">
										<img src={imgToTextIcon} className="w-9 block" alt="Project" />
									</button>
								</li>
								<li>
									<button className="size-10 appearance-none bg-transparent">
										<img src={editImgIcon} className="w-9 block" alt="Project" />
									</button>
								</li>
							</ul>
						</nav>
					</div>
				</aside>
				<div className="w-5/12 grow px-3 md:px-4 xl:px-10 flex flex-col transition-all duration-200 ease-linear">
					<Header headerClass={'!py-6 [&>.container>.flex>.logo]:hidden [&>.container>.flex>nav>.flex]:justify-left'}/>
					<DressVariationsGenerator/>
				</div>
			</div>
		</>
	);
}
