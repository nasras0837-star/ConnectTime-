"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";

export default function CreatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setNotice("");
    if (!selected) { setFile(null); setPreviewUrl(""); return; }
    const isImage = selected.type.startsWith("image/");
    const isVideo = selected.type.startsWith("video/");
    if (!isImage && !isVideo) { setFile(null); setPreviewUrl(""); setNotice("Choose an image or video file."); event.target.value = ""; return; }
    if (selected.size > 100 * 1024 * 1024) { setFile(null); setPreviewUrl(""); setNotice("Files must be 100 MB or smaller in this preview."); event.target.value = ""; return; }
    setFile(selected);
  }

  function previewPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !accepted) return;
    setNotice("Your content preview is ready. Public publishing is currently locked until ConnectTime's server-side media moderation and storage are connected.");
  }

  return (
    <main className="createPage">
      <header className="createHeader"><Link href="/" className="createBrand" aria-label="ConnectTime home"><Image src="/connecttime-logo.svg" alt="ConnectTime" width={150} height={98} priority className="ctLogoImage"/></Link><nav><Link href="/">Home</Link><Link href="/videos">ConnectTime TV</Link><Link href="/events">Events</Link></nav></header>
      <section className="createHero"><span>CREATE · SHARE · CONNECT</span><h1>Your moment deserves<br/><em>to be seen.</em></h1><p>Share photos and videos, tell your story, and connect with people who love what you love—wherever they are in the world.</p></section>
      <section className="createWorkspace">
        <form className="createCard" onSubmit={previewPost}>
          <div className="createCardHead"><div><span>NEW COMMUNITY POST</span><h2>Create a post</h2></div><span className="createAdult">18+ community</span></div>
          <label className="createCaption">What&apos;s happening?<textarea rows={4} maxLength={1500} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Share a moment, a thought, or something you made…"/></label>
          <input ref={inputRef} className="createFileInput" type="file" accept="image/*,video/*" onChange={chooseFile} aria-label="Choose a photo or video"/>
          <button type="button" className="createUploadArea" onClick={() => inputRef.current?.click()}>
            <span className="createUploadIcon">{file?.type.startsWith("video/") ? "🎥" : "📷"}</span>
            <b>{file ? "Choose a different photo or video" : "Add photos or videos"}</b>
            <small>Images and videos · Maximum 100 MB in this preview</small>
            <span className="createChoose">Choose media</span>
          </button>
          {previewUrl && <div className="createPreview">{file?.type.startsWith("video/") ? <video src={previewUrl} controls playsInline /> : <img src={previewUrl} alt="Selected media preview"/>}<div><b>{file?.name}</b><small>{file ? (file.size / (1024 * 1024)).toFixed(1) + " MB" : ""}</small></div></div>}
          <div className="contentRules"><b>Community content rules</b> <Link href="/community-guidelines">Read the full Community Guidelines</Link><ul><li>No nudity, sexually explicit images, or pornographic content.</li><li>No sexual exploitation, non-consensual intimate imagery, or content involving minors.</li><li>No threats, harassment, intimidation, stalking, doxxing, or illegal content.</li><li>Good-faith opinions, criticism, debate, and unpopular viewpoints are welcome; disagreement alone is not a violation.</li><li>Only share media you have the rights and permission to post.</li></ul><label className="createConsent"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)}/> I confirm this content follows ConnectTime&apos;s rules, including the no-harassment and no-intimidation standard.</label></div>
          <button className="createSubmit" type="submit" disabled={!file || !accepted}>Prepare post preview</button>
          {notice && <p className="createNotice" role="status">{notice}</p>}
          <p className="createDisclaimer">Preview only. Media is not uploaded, stored, or published. Public posting will remain disabled until server-side file validation, nudity/sexual-content moderation, reporting, and secure media storage are tested.</p>
        </form>
        <aside className="createSafety"><span>🛡️</span><h3>Open expression, without harassment</h3><p>ConnectTime welcomes creativity, culture, hobbies, education, good-faith debate, criticism, and differing opinions. Harassment, intimidation, threats, and privacy violations are not allowed.</p><div>🚫 No nudity or pornographic content</div><div>🔞 Adults 18+ only</div><div>🤝 Respect consent and privacy</div><div>🌍 Share respectfully across cultures</div><Link href="/">Back to community →</Link></aside>
      </section>
      <footer className="createFooter">ConnectTime · Share your world, safely. · Adults 18+</footer>
    </main>
  );
}
