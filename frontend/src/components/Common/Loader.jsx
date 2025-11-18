// components/Loader.jsx
import { cn } from "@/lib/utils";
import React from "react";

const Loader = ({className}) => {
  return (
    <div className={cn("fixed flex z-10 items-center justify-center size-full !m-0", className)}>
      <div className="size-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;
