// SMS sending. Texts follow SPEC 9.1 (sent in the resident's language).
// Providers: "console" (default, prints to the terminal), "memory" (tests).

export type Lang = "sq" | "mk" | "en";
export interface SmsProvider { send(to: string, text: string): Promise<void> }

export const sentSms: { to: string; text: string }[] = [];

const providers: Record<string, SmsProvider> = {
  console: { async send(to, text) { console.log(`\n[SMS to ${to}] ${text}\n`); } },
  memory: { async send(to, text) { sentSms.push({ to, text }); } },
};

export function smsProvider(): SmsProvider {
  return providers[process.env.SMS_PROVIDER ?? "console"] ?? providers.console;
}

export async function sendSms(to: string, text: string) {
  await smsProvider().send(to, text);
}

export const smsText = {
  loginCode: (lang: Lang, code: string) => ({
    sq: `Kodi juaj per hyrje: ${code}. Vlen 5 minuta. Mos ia jepni askujt.`,
    mk: `Вашиот код за најава: ${code}. Важи 5 минути. Не го споделувајте.`,
    en: `Your login code: ${code}. Valid for 5 minutes. Do not share it with anyone.`,
  })[lang],
  invite: (lang: Lang, name: string, place: string, link: string) => ({
    sq: `Pershendetje ${name}, jeni ftuar ne ${place} per te pare dhe paguar shpenzimet e nderteses. Hyni ketu: ${link}`,
    mk: `Здраво ${name}, поканети сте во ${place}. Најавете се тука: ${link}`,
    en: `Hello ${name}, you are invited to ${place} to view and pay building expenses. Log in here: ${link}`,
  })[lang],
  cashRecorded: (lang: Lang, amount: string, months: string, apt: string, receipt: string) => ({
    sq: `U pranuan ${amount} per ${months}, Banesa ${apt}. Kuponi nr. ${receipt}.`,
    mk: `Примени ${amount} за ${months}, Стан ${apt}. Признаница бр. ${receipt}.`,
    en: `Received ${amount} for ${months}, Apt ${apt}. Receipt no. ${receipt}.`,
  })[lang],
};
