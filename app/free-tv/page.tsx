import FreeTvDirectory from "./free-tv-directory";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Free TV | ConnectTime",
  description: "Browse free official television and news services from broadcasters around the world.",
};

export default function FreeTvPage() {
  // The channel directory is public. The watchlist API independently enforces
  // sign-in and verified-adult member access for all saved-channel operations.
  return <FreeTvDirectory />;
}
