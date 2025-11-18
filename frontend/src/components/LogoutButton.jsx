import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TbLogout } from "react-icons/tb";
import { IoMdSettings } from "react-icons/io";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { socket } from "@/hooks/useSocket";
import { MdSubscriptions } from "react-icons/md";

export default function UserDropdown({ trigger }) {  
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect();
      console.log("❌ Socket manually disconnected");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    disconnectSocket();
  };

  return (
    <DropdownMenu>
      {/* use trigger passed from parent */}
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-52 md:min-w-64 max-w-80 max-h-80 overflow-y-auto bg-black/60 backdrop-blur-md border border-pink-300/20 shadow-2xl text-white">
      {/* <DropdownMenuItem
          className="cursor-pointer hover:bg-amber-500"
          onClick={() => navigate("/subscriptions")}
        >
          <MdSubscriptions className="mr-2 h-4 w-4" />
          <span>Subscriptions</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem className={'cursor-pointer hover:bg-amber-500'} onClick={() => navigate("/user-setting")}>
          <IoMdSettings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-500 focus:text-red-600 cursor-pointer"
        >
          <TbLogout className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
