// ការកំណត់សម្រាប់ checkout

export const DELIVERY_FEE = 0; // ដឹកឥតគិតថ្លៃទាំងអស់

export const provinces = [
  "ភ្នំពេញ", "កណ្តាល", "កំពង់ចាម", "កំពង់ឆ្នាំង", "កំពង់ស្ពឺ", "កំពង់ធំ", "កំពត", "កែប",
  "កោះកុង", "ក្រចេះ", "តាកែវ", "ត្បូងឃ្មុំ", "បន្ទាយមានជ័យ", "បាត់ដំបង", "ប៉ៃលិន",
  "ពោធិ៍សាត់", "ព្រះវិហារ", "ព្រះសីហនុ", "ព្រៃវែង", "មណ្ឌលគិរី", "រតនគិរី", "សៀមរាប",
  "ស្ទឹងត្រែង", "ស្វាយរៀង", "ឧត្តរមានជ័យ",
];

export type PaymentMethod = "khqr" | "cod";

export const paymentLabels: Record<PaymentMethod, string> = {
  khqr: "KHQR (ABA, ACLEDA, Wing ...)",
  cod: "បង់ពេលទទួលទំនិញ",
};

// លេខទូរស័ព្ទកម្ពុជា: 0xx xxx xxx ឬ +855 xx xxx xxx
export function normalizePhone(input: string) {
  const digits = input.replace(/[\s\-().]/g, "");
  if (/^\+?855\d{8,9}$/.test(digits)) return "0" + digits.replace(/^\+?855/, "");
  if (/^0\d{8,9}$/.test(digits)) return digits;
  return null;
}
