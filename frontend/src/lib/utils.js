import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const hasPermission = (permissionArray, keyToCheck) => {
	return Array.isArray(permissionArray) && permissionArray.includes(keyToCheck);
};


export const formatMinutes = (ms) => {
  const seconds = ms / 1000;
  const minutes = ms / 60000;

  if (minutes < 1) {
    return `${Math.round(seconds)} sec`;
  } else if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  } else {
    return `${(minutes / 60).toFixed(1)} hr`;
  }
};
