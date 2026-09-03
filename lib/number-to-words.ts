export function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
    "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToStr = (n: number): string => {
    let str = "";
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 > 0 ? " " + a[n % 10] : "");
    } else {
      str += a[n];
    }
    return str;
  };

  let word = "";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;

  if (crore > 0) word += numToStr(crore) + " Crore ";
  if (lakh > 0) word += numToStr(lakh) + " Lakh ";
  if (thousand > 0) word += numToStr(thousand) + " Thousand ";
  if (hundred > 0) word += numToStr(hundred) + " Hundred ";
  if (num > 0) word += numToStr(num);

  return "Rupees " + word.trim() + " Only";
}
