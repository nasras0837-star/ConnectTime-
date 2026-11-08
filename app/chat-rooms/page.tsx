import { redirect } from "next/navigation";

// The former chat-room page used browser-only sample data, so rooms and
// messages disappeared on refresh and private-room invite codes were not
// validated. Route visitors to the persistent, authenticated Groups system
// instead of presenting that demo as a live chat service.
export default function ChatRoomsPage() {
  redirect("/groups");
}
