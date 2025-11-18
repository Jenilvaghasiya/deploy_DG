import { Link } from "react-router-dom";
import { MdErrorOutline } from "react-icons/md";

export default function NotFound() {
	return (
		<div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
			<div className="text-center space-y-6 max-w-md">
				<MdErrorOutline className="mx-auto text-pink-500" size={80} />
				<h1 className="text-4xl font-bold">404 - Page Not Found</h1>
				<p className="text-gray-300 text-sm">
					Oops! The page you are looking for doesn’t exist or you
					don’t have access to it.
				</p>
				<Link
					to="/user-projects"
					className="inline-block bg-pink-500 hover:bg-pink-600 text-white text-sm px-6 py-3 rounded-full transition"
				>
					← Back to My Projects
				</Link>
			</div>
		</div>
	);
}
