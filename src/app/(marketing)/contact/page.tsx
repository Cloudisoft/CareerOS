import { permanentRedirect } from "next/navigation";

/** /contact is the same page as /support. */
export default function ContactPage() {
  permanentRedirect("/support");
}
