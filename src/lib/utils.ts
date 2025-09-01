import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price?: number) => {
  return price ? new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(price) : '-';
};

export const parseMultipleInputs = (input: string): string[] => {
  if (!input.trim()) return [];
  
  return input
    .split(/[,;]+/) // Split by comma or semicolon
    .map(item => item.trim()) // Remove whitespace
    .filter(item => item.length > 0); // Remove empty items
};
