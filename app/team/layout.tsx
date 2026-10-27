import type { Metadata } from "next";

// Team-facing pages: keep them out of search engines. This is not access
// control; real protection for /team is in the plan's Later section.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TeamLayout({ children }: LayoutProps<"/team">) {
  return children;
}
