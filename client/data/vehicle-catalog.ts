/**
 * Catálogo de marcas y modelos de autos comunes en México.
 * NO es exhaustivo — al final del selector siempre hay opción "Otra".
 */

export const VEHICLE_BRANDS_MODELS: Record<string, string[]> = {
  Acura: ["ILX", "MDX", "RDX", "TLX"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7", "Q8"],
  BMW: ["Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "Serie 7", "X1", "X2", "X3", "X4", "X5", "X6", "X7"],
  BYD: ["Dolphin", "Han", "Seal", "Song", "Tang", "Yuan"],
  Chevrolet: ["Aveo", "Beat", "Onix", "Spark", "Tracker", "Cavalier", "Cruze", "Equinox", "Trailblazer", "Tahoe", "Suburban", "Silverado", "Camaro"],
  Chrysler: ["300", "Pacifica"],
  Citroën: ["C3", "C4", "C5 Aircross"],
  Dodge: ["Attitude", "Vision", "Journey", "Charger", "Challenger", "Durango", "RAM 1500", "RAM 2500"],
  Fiat: ["500", "Argo", "Cronos", "Mobi", "Uno", "Pulse", "Strada"],
  Ford: ["Fiesta", "Figo", "Focus", "Ka", "EcoSport", "Escape", "Edge", "Explorer", "Expedition", "F-150", "F-250", "Lobo", "Maverick", "Mustang", "Ranger", "Bronco", "Bronco Sport", "Territory"],
  GMC: ["Acadia", "Canyon", "Sierra", "Terrain", "Yukon"],
  Honda: ["City", "Civic", "Accord", "Fit", "HR-V", "CR-V", "Pilot", "BR-V", "Odyssey", "Ridgeline"],
  Hyundai: ["Accent", "Elantra", "Sonata", "Grand i10", "i10", "Kona", "Creta", "Tucson", "Santa Fe", "Palisade", "Venue", "Ioniq 5"],
  Jeep: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Wagoneer"],
  KIA: ["Picanto", "Rio", "Forte", "K3", "K5", "Soul", "Seltos", "Sportage", "Sorento", "Carnival", "Telluride"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar"],
  Lexus: ["IS", "ES", "RX", "NX", "GX", "LX", "UX", "RC"],
  Lincoln: ["Aviator", "Corsair", "Nautilus", "Navigator"],
  MG: ["MG3", "MG5", "GT", "ZS", "HS", "RX5", "RX8"],
  Mazda: ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-50", "CX-9", "MX-5"],
  "Mercedes-Benz": ["Clase A", "Clase C", "Clase E", "Clase S", "CLA", "GLA", "GLB", "GLC", "GLE", "GLS", "Sprinter"],
  Mini: ["Cooper", "Cooper S", "Countryman", "Clubman"],
  Mitsubishi: ["Mirage", "L200", "Outlander", "Eclipse Cross", "Montero", "ASX", "Xpander"],
  Nissan: ["March", "Versa", "Sentra", "Altima", "Maxima", "Note", "Kicks", "X-Trail", "Murano", "Pathfinder", "Patrol", "Frontier", "Navara", "NP300", "Leaf"],
  Peugeot: ["208", "2008", "3008", "5008", "308", "Partner"],
  Porsche: ["718 Cayman", "911", "Cayenne", "Macan", "Panamera", "Taycan"],
  RAM: ["1500", "2500", "3500", "700", "ProMaster"],
  Renault: ["Kwid", "Stepway", "Logan", "Sandero", "Duster", "Oroch", "Captur", "Koleos", "Megane"],
  SEAT: ["Ibiza", "Leon", "Toledo", "Arona", "Ateca", "Tarraco"],
  Subaru: ["Impreza", "Legacy", "Outback", "Forester", "Crosstrek", "Ascent", "BRZ", "WRX"],
  Suzuki: ["Alto", "Swift", "Baleno", "Ciaz", "S-Cross", "Vitara", "Jimny", "Ignis"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  Toyota: ["Yaris", "Corolla", "Camry", "Avalon", "Prius", "Avanza", "C-HR", "Corolla Cross", "RAV4", "Highlander", "Sequoia", "Land Cruiser", "4Runner", "Hilux", "Tacoma", "Tundra", "Hiace", "Sienna"],
  Volkswagen: ["Polo", "Virtus", "Vento", "Jetta", "Passat", "Saveiro", "Taos", "T-Cross", "Tiguan", "Teramont", "Crafter", "Amarok"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "S90", "V60"],
};

/**
 * Colores comunes con hex para mostrar como swatches.
 * El usuario también puede escribir un color custom en el input "Otro".
 */
export const VEHICLE_COLORS: Array<{ name: string; hex: string; border?: boolean }> = [
  { name: "Blanco",   hex: "#FFFFFF", border: true },
  { name: "Negro",    hex: "#1A1A1A" },
  { name: "Gris",     hex: "#6B7280" },
  { name: "Plata",    hex: "#C0C0C0" },
  { name: "Rojo",     hex: "#DC2626" },
  { name: "Azul",     hex: "#1D4ED8" },
  { name: "Azul claro", hex: "#3B82F6" },
  { name: "Verde",    hex: "#16A34A" },
  { name: "Amarillo", hex: "#EAB308" },
  { name: "Naranja",  hex: "#EA580C" },
  { name: "Café",     hex: "#78350F" },
  { name: "Beige",    hex: "#D6BFA1" },
  { name: "Vino",     hex: "#7F1D1D" },
  { name: "Morado",   hex: "#7C3AED" },
];
