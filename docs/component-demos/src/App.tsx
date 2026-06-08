import { useEffect, useState } from "react";
import { demoBySlug } from "./registry";

function readSlug(): string {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash || "true-false";
}

export default function App() {
  const [slug, setSlug] = useState(readSlug);

  useEffect(() => {
    const onHashChange = () => setSlug(readSlug());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const demo = demoBySlug.get(slug);
  if (!demo) {
    return (
      <p className="lk-component-demo-missing">
        Unknown demo <code>{slug}</code>. Pick a component from the documentation page.
      </p>
    );
  }

  return demo.render();
}
