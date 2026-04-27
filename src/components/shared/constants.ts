export const CATEGORIES = [
  { value: "transporte", label: "Transporte" },
  { value: "alojamiento", label: "Alojamiento" },
  { value: "comidas", label: "Comidas" },
  { value: "gasolina", label: "Gasolina" },
  { value: "otros", label: "Otros" },
];

export const CURRENCIES = [
  "EUR", "USD", "GBP", "COP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF"
];

export const COUNTRIES = [
  "España", "Francia", "Alemania", "Italia", "Portugal", "Reino Unido",
  "Países Bajos", "Bélgica", "Suiza", "Polonia", "Colombia", "México",
  "Estados Unidos", "Dinamarca", "Suecia", "Noruega", "Otros"
];

export const COUNTRY_FLAGS: Record<string, string> = {
  "España": "🇪🇸",
  "Francia": "🇫🇷",
  "Alemania": "🇩🇪",
  "Italia": "🇮🇹",
  "Portugal": "🇵🇹",
  "Reino Unido": "🇬🇧",
  "Países Bajos": "🇳🇱",
  "Bélgica": "🇧🇪",
  "Suiza": "🇨🇭",
  "Polonia": "🇵🇱",
  "Colombia": "🇨🇴",
  "México": "🇲🇽",
  "Estados Unidos": "🇺🇸",
  "Dinamarca": "🇩🇰",
  "Suecia": "🇸🇪",
  "Noruega": "🇳🇴",
  "Otros": "🌍",
};

export const CATEGORY_COLORS: Record<string, string> = {
  transporte: "#3b82f6",
  alojamiento: "#8b5cf6",
  comidas: "#f59e0b",
  gasolina: "#10b981",
  otros: "#6b7280",
};

export const CATEGORY_BADGE: Record<string, string> = {
  transporte: "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20",
  alojamiento: "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20",
  comidas: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
  gasolina: "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20",
  otros: "bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20",
};
