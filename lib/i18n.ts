// UI texts. Albanian is the default (SPEC 4). Macedonian is a Should feature.
const sq = {
  appName: "Shpenzimet e ndërtesës",
  login: "Hyr", phone: "Numri i telefonit", sendCode: "Dërgo kodin",
  codeSent: "Nëse ky numër është i regjistruar, ju dërguam një kod.",
  enterCode: "Shkruani kodin 6-shifror që ju dërguam në", code: "Kodi", resend: "Ridërgo kodin",
  badCode: "Kodi është i gabuar ose ka skaduar. Pas 5 provave të gabuara kërkoni kod të ri.",
  badPhone: "Numri i telefonit nuk është i vlefshëm.", logout: "Dil",
  buildings: "Ndërtesat", newBuilding: "Ndërtesë e re", name: "Emri", country: "Shteti",
  startMonth: "Muaji i parë i pagesës", create: "Krijo", save: "Ruaj",
  apartments: "Banesat", number: "Numri", floor: "Kati", addApartment: "Shto banesë",
  services: "Shërbimet", addService: "Shto shërbim", prices: "Çmimet mujore sipas katit",
  service: "Shërbimi", amount: "Shuma", validFrom: "Vlen nga", setPrice: "Vendos çmimin",
  residents: "Banorët", firstName: "Emri", lastName: "Mbiemri", language: "Gjuha", invite: "Fto banorin",
  apartment: "Banesa", noneYet: "Asgjë ende.", saved: "U ruajt.", invited: "Banori u ftua. SMS u dërgua.",
  errDuplicate: "Ekziston tashmë.", errInvalid: "Të dhëna të pavlefshme.", errPhoneTaken: "Ky numër përdoret nga një banor tjetër.",
  myApartment: "Banesa ime", building: "Ndërtesa", welcome: "Mirë se vini",
  floorShort: "Kati",
};
export type Texts = typeof sq;

const en: Texts = {
  appName: "Building expenses",
  login: "Log in", phone: "Phone number", sendCode: "Send code",
  codeSent: "If this number is registered, we sent you a code.",
  enterCode: "Enter the 6-digit code we sent to", code: "Code", resend: "Resend code",
  badCode: "The code is wrong or has expired. After 5 wrong attempts, request a new code.",
  badPhone: "The phone number is not valid.", logout: "Log out",
  buildings: "Buildings", newBuilding: "New building", name: "Name", country: "Country",
  startMonth: "First month to pay", create: "Create", save: "Save",
  apartments: "Apartments", number: "Number", floor: "Floor", addApartment: "Add apartment",
  services: "Services", addService: "Add service", prices: "Monthly prices per floor",
  service: "Service", amount: "Amount", validFrom: "Valid from", setPrice: "Set price",
  residents: "Residents", firstName: "First name", lastName: "Last name", language: "Language", invite: "Invite resident",
  apartment: "Apartment", noneYet: "Nothing yet.", saved: "Saved.", invited: "Resident invited. SMS sent.",
  errDuplicate: "This already exists.", errInvalid: "Invalid data.", errPhoneTaken: "This number is used by another resident.",
  myApartment: "My apartment", building: "Building", welcome: "Welcome",
  floorShort: "Floor",
};

export function t(lang: string | undefined): Texts {
  return lang === "en" ? en : sq;
}
