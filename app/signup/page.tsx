"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];
import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";
import { LanguageText } from "@/app/components/language-provider";

function friendlyAuthMessage(error: unknown, fallback: string) {
  const value = error && typeof error === "object" ? error as { type?: string; code?: number; message?: string } : {};
  if (value.type === "user_already_exists") return "An account with this email already exists. Log in instead.";
  if (value.type === "user_blocked") return "This account is currently disabled. Contact Connect support for help.";
  if (value.type === "general_rate_limit_exceeded" || value.code === 429) return "There have been too many attempts. Wait a little while and try again.";
  if (value.type === "password_recently_used") return "Choose a password you have not used recently.";
  if (value.type === "password_personal_data") return "Choose a password that does not contain your personal information.";
  if (value.type === "general_argument_invalid") return "Some details were not accepted. Check the form and try again.";
  if (value.code === 503) return "The registration service is temporarily unavailable. Please try again shortly.";
  return value.message?.trim() || fallback;
}

export default function SignupPage() {
  const router = useRouter();
  const { signUp, error } = useAuth();
  const [message, setMessage] = useState("");
  const [authConfigured, setAuthConfigured] = useState<boolean | null>(null);
  const [statusUnavailable, setStatusUnavailable] = useState(false);
  const [missingConfig, setMissingConfig] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/status", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Authentication status could not be checked.");
        return response.json() as Promise<{ configured: boolean; missing?: string[] }>;
      })
      .then(status => { if (active) { setAuthConfigured(status.configured); setMissingConfig(status.missing || []); } })
      .catch(() => { if (active) setStatusUnavailable(true); });
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const form = new FormData(event.currentTarget);
    if (!String(form.get("country") || "").trim()) { setMessage("Please select the country where you live."); return; }
    if (form.get("adult") !== "on") { setMessage("You must confirm that you are 18 or older."); return; }
    if (String(form.get("password") || "") !== String(form.get("confirmPassword") || "")) { setMessage("Your passwords do not match."); return; }
    try { await signUp.emailPassword({ email: String(form.get("email") || "").trim().toLowerCase(), password: String(form.get("password") || ""), name: String(form.get("name") || "").trim(), onSuccess: () => { router.push("/account?welcome=1&country="+encodeURIComponent(String(form.get("country")||""))); router.refresh(); } }); }
    catch (err) { setMessage(friendlyAuthMessage(err, "Registration is not available yet.")); }
  }
  return <main className="authShell"><Link className="logo ctAuthLogo" href="/" aria-label="Connect home"><img src="/connect-logo.svg" alt="Connect" width={180} height={117} className="ctLogoImage"/></Link><form className="authCard" onSubmit={submit}><div className="eyebrow">JOIN THE COMMUNITY</div><h1><LanguageText k="createAccount" /></h1><p><LanguageText k="adultsOnly" /></p><label><LanguageText k="displayName" /><input name="name" autoComplete="name" maxLength={80} required/></label><label><LanguageText k="emailAddress" /><input name="email" type="email" autoComplete="email" required/></label><label><LanguageText k="countryWhereLive" /><select name="country" defaultValue="" required><option value="" disabled>Select your country</option>{countries.map(country=><option key={country} value={country}>{country}</option>)}</select></label><label><LanguageText k="password" /><input name="password" type="password" minLength={12} maxLength={256} autoComplete="new-password" aria-describedby="password-help" required/><small id="password-help">Use at least 12 characters.</small></label><label>Confirm password<input name="confirmPassword" type="password" minLength={12} maxLength={256} autoComplete="new-password" required/></label><label className="consent"><input name="adult" type="checkbox" required/> <LanguageText k="confirm18" /></label><label className="consent"><input name="communityGuidelines" type="checkbox" required/> I agree to the <Link href="/community-guidelines">Community Guidelines</Link>, including the rules against harassment, intimidation, threats, and privacy violations.</label><label className="consent"><input name="legalTerms" type="checkbox" required/> I agree to the <Link href="/legal/terms">Terms of Service</Link> and acknowledge the <Link href="/legal/privacy">Privacy Notice</Link>.</label><button className="button" disabled={signUp.isPending}>{signUp.isPending ? "Creating your account…" : authConfigured === null ? "Checking registration…" : "Register Now"}</button>{statusUnavailable ? <p role="status" className="message">We could not run the service pre-check. You can still try registering; if it fails, try again shortly.</p> : authConfigured === false ? <p role="status" className="message">The service pre-check found missing server settings{missingConfig.length ? `: ${missingConfig.join(", ")}` : ""}. You can still try registering; contact the pilot administrator if the request fails.</p> : null}{(message || error) && <p role="alert" className="message">{message || friendlyAuthMessage(error, "Registration failed. Please try again.")}</p>}<small><LanguageText k="ageVerificationNote" /> Your 18+ confirmation is not independent age verification. Some community features remain restricted until required adult verification and account activation are completed.</small><p className="switch"><LanguageText k="alreadyRegistered" /> <Link href="/login"><LanguageText k="login" /></Link></p></form></main>;
}
