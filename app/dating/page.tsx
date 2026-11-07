import Link from "next/link";

const checks = [
  { icon: "🪪", title: "Government-issued photo ID", text: "Use a valid US state ID card or driver’s license, or a national identity card or passport issued by your country." },
  { icon: "🎂", title: "Date-of-birth validation", text: "The verification provider checks the date of birth on your document and confirms that you meet the minimum age of 18." },
  { icon: "🤳", title: "Identity & liveness match", text: "A secure selfie/liveness check is used to help confirm that the person presenting the document is its rightful holder." },
  { icon: "🔐", title: "Verified access only", text: "Dating profiles, discovery, and dating conversations stay locked until identity and adult eligibility checks return a successful result." },
];

export default function DatingPage() {
  return <main className="datingShell">
    <header className="datingHeader">
      <Link href="/" className="datingBrand"><img src="https://raw.githubusercontent.com/nasras0837-star/ConnectTime-/main/Glossy%20ConnectTime%20Community%20Logo.png" alt="ConnectTime" width={142} height={92}/></Link>
      <nav><Link href="/">Home</Link><Link href="/signup">Create account</Link><Link href="/login" className="datingLogin">Log in</Link></nav>
    </header>
    <section className="datingHero">
      <div className="datingHeroCopy">
        <span className="datingEyebrow">🔒 CONNECTTIME DATING · ADULTS 18+ ONLY</span>
        <h1>Real connections.<br/><em>Verified adults.</em></h1>
        <p>ConnectTime Dating is a dedicated space for adults to discover meaningful matches. Safety starts before anyone can browse or message: every dating member must pass an identity and age-verification process.</p>
        <div className="datingHeroActions"><Link href="/signup">Create a ConnectTime account ↗</Link><span>Dating access stays locked until verification is complete.</span></div>
      </div>
      <div className="datingShield" aria-hidden="true"><div>🛡️</div><b>18+</b><small>IDENTITY<br/>CHECKED</small></div>
    </section>
    <section className="datingVerify">
      <div className="datingSectionIntro"><span>HOW ACCESS IS PROTECTED</span><h2>Verify your age and identity</h2><p>Members must complete all required checks with a trusted identity-verification provider before entering the Dating area.</p></div>
      <div className="datingCheckGrid">{checks.map((item,index)=><article className="datingCheck" key={item.title}><span className="datingCheckIcon">{item.icon}</span><small>STEP 0{index+1}</small><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      <div className="datingIdNote"><b>Which ID can I use?</b><p>For people in the United States: a valid state-issued ID card or driver’s license. For people in other countries: a valid national/country identity card or passport. The verification provider must support the document and country. A document alone is not enough; date of birth and identity must also be validated.</p></div>
    </section>
    <section className="datingGate">
      <div><span>MEMBERS-ONLY ACCESS</span><h2>No verification, no Dating access.</h2><p>Self-declared age, a signup checkbox, or an unverified profile will never unlock Dating. Failed, inconclusive, expired, or incomplete checks remain restricted and may require a secure re-verification.</p></div>
      <div className="datingGateStatus"><span>🔒</span><b>Verification required</b><small>Dating discovery & messaging locked</small></div>
    </section>
    <section className="datingPrivacy"><span>YOUR DOCUMENTS DESERVE CARE</span><h2>Secure verification—not public profile content.</h2><p>Government ID images and selfie checks must be submitted directly to the integrated verification provider through its secure flow, never posted to profiles, chats, or public storage. ConnectTime should retain only the minimum verification result and audit metadata needed to enforce access, according to the provider contract and applicable law.</p></section>
    <footer className="datingFooter"><span>© {new Date().getFullYear()} ConnectTime · Dating is strictly for adults 18+</span><Link href="/">Back to ConnectTime</Link></footer>
    <p className="datingPreviewNotice">Preview notice: the verification-provider integration is not configured in this build. This page describes the required access policy; it does not collect ID documents or verify anyone yet. Dating remains unavailable until the secure provider integration, server-side enforcement, and testing are complete.</p>
  </main>;
}
