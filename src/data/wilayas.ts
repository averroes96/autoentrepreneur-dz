/**
 * Nomenclature officielle des 58 Wilayas d'Algérie
 * Utilisée pour la validation géographique du NIF (Positions 1-2) et la conformité administrative.
 */

export interface Wilaya {
  code: string;
  name: string;
  arabicName: string;
}

export const ALGERIAN_WILAYAS: Record<string, Wilaya> = {
  "01": { code: "01", name: "Adrar", arabicName: "أدرار" },
  "02": { code: "02", name: "Chlef", arabicName: "الشلف" },
  "03": { code: "03", name: "Laghouat", arabicName: "الأغواط" },
  "04": { code: "04", name: "Oum El Bouaghi", arabicName: "أم البواقي" },
  "05": { code: "05", name: "Batna", arabicName: "باتنة" },
  "06": { code: "06", name: "Béjaïa", arabicName: "بجاية" },
  "07": { code: "07", name: "Biskra", arabicName: "بسكرة" },
  "08": { code: "08", name: "Béchar", arabicName: "بشار" },
  "09": { code: "09", name: "Blida", arabicName: "البليدة" },
  "10": { code: "10", name: "Bouira", arabicName: "البويرة" },
  "11": { code: "11", name: "Tamanrasset", arabicName: "تمنراست" },
  "12": { code: "12", name: "Tébessa", arabicName: "تبسة" },
  "13": { code: "13", name: "Tlemcen", arabicName: "تلمسان" },
  "14": { code: "14", name: "Tiaret", arabicName: "تيارت" },
  "15": { code: "15", name: "Tizi Ouzou", arabicName: "تيزي وزو" },
  "16": { code: "16", name: "Alger", arabicName: "الجزائر" },
  "17": { code: "17", name: "Djelfa", arabicName: "الجلفة" },
  "18": { code: "18", name: "Jijel", arabicName: "جيجل" },
  "19": { code: "19", name: "Sétif", arabicName: "سطيف" },
  "20": { code: "20", name: "Saïda", arabicName: "سعيدة" },
  "21": { code: "21", name: "Skikda", arabicName: "سكيكدة" },
  "22": { code: "22", name: "Sidi Bel Abbès", arabicName: "سيدي بلعباس" },
  "23": { code: "23", name: "Annaba", arabicName: "عنابة" },
  "24": { code: "24", name: "Guelma", arabicName: "قالمة" },
  "25": { code: "25", name: "Constantine", arabicName: "قسنطينة" },
  "26": { code: "26", name: "Médéa", arabicName: "المدية" },
  "27": { code: "27", name: "Mostaganem", arabicName: "مستغانم" },
  "28": { code: "28", name: "M'Sila", arabicName: "المسيلة" },
  "29": { code: "29", name: "Mascara", arabicName: "معسكر" },
  "30": { code: "30", name: "Ouargla", arabicName: "ورقلة" },
  "31": { code: "31", name: "Oran", arabicName: "وهران" },
  "32": { code: "32", name: "El Bayadh", arabicName: "البيض" },
  "33": { code: "33", name: "Illizi", arabicName: "إليزي" },
  "34": { code: "34", name: "Bordj Bou Arréridj", arabicName: "برج بوعريريج" },
  "35": { code: "35", name: "Boumerdès", arabicName: "بومرداس" },
  "36": { code: "36", name: "El Tarf", arabicName: "الطارف" },
  "37": { code: "37", name: "Tindouf", arabicName: "تندوف" },
  "38": { code: "38", name: "Tissemsilt", arabicName: "تيسمسيلت" },
  "39": { code: "39", name: "El Oued", arabicName: "الوادي" },
  "40": { code: "40", name: "Khenchela", arabicName: "خنشلة" },
  "41": { code: "41", name: "Souk Ahras", arabicName: "سوق أهراس" },
  "42": { code: "42", name: "Tipaza", arabicName: "تيبازة" },
  "43": { code: "43", name: "Mila", arabicName: "ميلة" },
  "44": { code: "44", name: "Aïn Defla", arabicName: "عين الدفلى" },
  "45": { code: "45", name: "Naâma", arabicName: "النعامة" },
  "46": { code: "46", name: "Aïn Témouchent", arabicName: "عين تموشنت" },
  "47": { code: "47", name: "Ghardaïa", arabicName: "غرداية" },
  "48": { code: "48", name: "Relizane", arabicName: "غليزان" },
  "49": { code: "49", name: "Timimoun", arabicName: "تيميمون" },
  "50": { code: "50", name: "Bordj Badji Mokhtar", arabicName: "برج باجي مختار" },
  "51": { code: "51", name: "Ouled Djellal", arabicName: "أولاد جلال" },
  "52": { code: "52", name: "Béni Abbès", arabicName: "بني عباس" },
  "53": { code: "53", name: "In Salah", arabicName: "عين صالح" },
  "54": { code: "54", name: "In Guezzam", arabicName: "عين قزام" },
  "55": { code: "55", name: "Touggourt", arabicName: "تقرت" },
  "56": { code: "56", name: "Djanet", arabicName: "جانت" },
  "57": { code: "57", name: "El M'Ghair", arabicName: "المغير" },
  "58": { code: "58", name: "El Meniaa", arabicName: "المنيعة" },
};

export function getWilayaByCode(code: string): Wilaya | undefined {
  const normalized = code.padStart(2, "0");
  return ALGERIAN_WILAYAS[normalized];
}
