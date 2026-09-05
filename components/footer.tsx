import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const footerGroups = [
  { label: "Studio", links: [["Work", "/work"], ["Services", "/services"], ["Book", "/book"], ["Contact", "/contact"]] },
  { label: "The Hub", links: [["Latest", "/media/latest"], ["Watch", "/media/watch"], ["Live", "/media/live"], ["Community", "/community"]] },
  { label: "Information", links: [["About", "/about"], ["Privacy", "/privacy"], ["Cookies", "/cookies"], ["Terms", "/terms"]] },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div><BrandMark className="footer-brand" /><p className="project-kicker">Independent creative studio + media platform</p></div>
        <nav className="footer-nav" aria-label="Footer navigation">
          {footerGroups.map((group) => (
            <div key={group.label}><p className="footer-label">{group.label}</p><ul className="footer-list">{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></div>
          ))}
        </nav>
      </div>
      <div className="footer-bottom"><span>London / UK</span><span>Social links managed in Site Settings</span><span>© {new Date().getFullYear()} E-MEDIA</span></div>
    </footer>
  );
}
