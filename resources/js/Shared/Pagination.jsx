import { Link } from "@inertiajs/react";

export default function Pagination({ links, align = "end" }) {
    return (
        <nav>
            <ul className={`pagination justify-content-${align} mb-0`}>
                {links.map((link, index) => (
                    <li
                        key={index}
                        className={`page-item ${
                            link.url === null ? "disabled" : ""
                        } ${link.active ? "active" : ""}`}
                    >
                        {link.url === null ? (
                            <span
                                className="page-link"
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ) : (
                            <Link
                                className="page-link"
                                href={link.url}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
