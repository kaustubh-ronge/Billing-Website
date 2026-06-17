import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function numberToWords(num) {
  if (num === 0) return "ZERO RUPEES ONLY";
  
  const parts = parseFloat(num).toFixed(2).split('.');
  const rupees = parseInt(parts[0], 10);
  const paise = parseInt(parts[1], 10);

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertHelper(n) {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
      if (n > 0) str += "and ";
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  function convertRupees(val) {
    if (val === 0) return "";
    let str = "";
    if (val >= 10000000) {
      str += convertHelper(Math.floor(val / 10000000)) + " Crore ";
      val %= 10000000;
    }
    if (val >= 100000) {
      str += convertHelper(Math.floor(val / 100000)) + " Lakh ";
      val %= 100000;
    }
    if (val >= 1000) {
      str += convertHelper(Math.floor(val / 1000)) + " Thousand ";
      val %= 1000;
    }
    if (val > 0) {
      str += convertHelper(val);
    }
    return str.trim();
  }

  let words = "";
  if (rupees > 0) {
    words += convertRupees(rupees) + " Rupees";
  } else {
    words += "Zero Rupees";
  }

  if (paise > 0) {
    words += " and " + convertHelper(paise) + " Paise";
  }

  words += " Only";
  return words.replace(/\s+/g, ' ').toUpperCase();
}
