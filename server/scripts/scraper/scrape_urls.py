import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.fomesoutra.com"
SOURCE_PAGES: List[Tuple[str, str]] = [
    ("exercice", f"{BASE_URL}/cours/secondaire/3eme/maths"),
    ("annale", f"{BASE_URL}/bepc/sujets-de-maths-3eme/anciens-sujets-de-mathematique-du-bepc"),
    ("livre", f"{BASE_URL}/les-livres/livres-et-annales-de-la-troisieme?limit=100"),
    ("annale", "https://www.banquedesepreuves.com/index.php/component/edocman/cote-d-ivoire/bepc"),
    ("annale", "https://epreuvesetcorriges.com/categories/cote-d-ivoire/examens/bepc"),
    ("annale", "https://sujetcorrige.com/sujets-bepc-cote-d-ivoire"),
]

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)


def is_pdf_candidate(url: str) -> bool:
    lowered = url.lower()
    pdf_markers = [".pdf", "/file", "download", "/edocman/", "task=document.download"]
    return any(marker in lowered for marker in pdf_markers)


def is_math_candidate(title: str, url: str) -> bool:
    haystack = f"{title} {url}".lower()
    math_keywords = [
        "math",
        "mathem",
        "pythagore",
        "thales",
        "trigono",
        "equation",
        "bepc",
        "namo",
        "zone",
        "annale",
        "sujet",
    ]
    non_math_keywords = [
        "physique",
        "chimie",
        "svt",
        "francais",
        "philosophie",
        "histoire",
        "geographie",
        "anglais",
        "espagnol",
        "allemand",
    ]
    return any(keyword in haystack for keyword in math_keywords) and not any(
        keyword in haystack for keyword in non_math_keywords
    )


def is_bepc_3eme_candidate(title: str, url: str) -> bool:
    haystack = f"{title} {url}".lower()
    level_markers = ["3eme", "troisieme", "3e", "bepc", "zone"]
    return any(marker in haystack for marker in level_markers)


def passes_strict_filters(source_type: str, title: str, url: str) -> bool:
    if not is_math_candidate(title, url):
        return False
    if not is_bepc_3eme_candidate(title, url):
        return False
    # Annales: force BEPC context
    if source_type == "annale":
        haystack = f"{title} {url}".lower()
        if "bepc" not in haystack and "zone" not in haystack:
            return False
    return True


def normalize_title(text: str, url: str) -> str:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if cleaned:
        return cleaned
    slug = Path(urlparse(url).path).name
    return slug or "document"


def looks_like_download_label(text: str) -> bool:
    lowered = text.lower()
    generic_tokens = ["telecharger", "download", "file", "pdf", "voir", "ouvrir"]
    return not text or any(token in lowered for token in generic_tokens)


def derive_link_title(anchor, absolute_url: str) -> str:
    direct = normalize_title(anchor.get_text(" ", strip=True), absolute_url)
    if not looks_like_download_label(direct):
        return direct

    card = anchor.find_parent(["article", "div", "li"])
    if card:
        candidate = card.find(["h1", "h2", "h3", "h4", "strong"])
        if candidate:
            title = normalize_title(candidate.get_text(" ", strip=True), absolute_url)
            if not looks_like_download_label(title):
                return title
    return direct


def fetch_html(url: str) -> str:
    response = requests.get(
        url,
        headers={"User-Agent": USER_AGENT},
        timeout=25,
    )
    response.raise_for_status()
    return response.text


def should_crawl_doc_page(link_url: str, source_type: str) -> bool:
    lowered = link_url.lower()
    if source_type != "annale":
        return False
    markers = ["bepc", "mathem", "math", "zone", "sujet", "edocman"]
    return any(marker in lowered for marker in markers) and "download" not in lowered


def collect_links(page_html: str, page_url: str, source_type: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(page_html, "html.parser")
    seen: Set[str] = set()
    results: List[Dict[str, str]] = []
    doc_pages: Set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        absolute_url = urljoin(page_url, href)
        title_text = derive_link_title(anchor, absolute_url)

        if source_type in {"livre", "annale", "exercice"} and not passes_strict_filters(
            source_type, title_text, absolute_url
        ):
            continue

        if is_pdf_candidate(absolute_url):
            if absolute_url in seen:
                continue
            seen.add(absolute_url)
            results.append(
                {
                    "url": absolute_url,
                    "title": title_text,
                    "sourceType": source_type,
                }
            )
            continue

        if should_crawl_doc_page(absolute_url, source_type):
            doc_pages.add(absolute_url)

    for doc_page in doc_pages:
        try:
            doc_html = fetch_html(doc_page)
        except Exception:
            continue
        doc_soup = BeautifulSoup(doc_html, "html.parser")
        page_title = normalize_title(doc_soup.title.get_text(" ", strip=True) if doc_soup.title else "", doc_page)

        for doc_anchor in doc_soup.find_all("a", href=True):
            doc_url = urljoin(doc_page, doc_anchor["href"].strip())
            if not is_pdf_candidate(doc_url):
                continue
            if doc_url in seen:
                continue
            anchor_title = derive_link_title(doc_anchor, doc_url)
            title = anchor_title if not looks_like_download_label(anchor_title) else page_title
            if source_type in {"livre", "annale", "exercice"} and not passes_strict_filters(
                source_type, title, doc_url
            ):
                continue
            seen.add(doc_url)
            results.append(
                {
                    "url": doc_url,
                    "title": title,
                    "sourceType": source_type,
                }
            )

    return results


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    output_path = script_dir / "urls.json"

    all_links: List[Dict[str, str]] = []
    for source_type, page_url in SOURCE_PAGES:
        print(f"Scraping {source_type}: {page_url}")
        try:
            html = fetch_html(page_url)
            links = collect_links(html, page_url, source_type)
            print(f"  -> found {len(links)} links")
            all_links.extend(links)
        except Exception as exc:
            print(f"  -> failed: {exc}")

    deduped = {(item["url"], item["sourceType"]): item for item in all_links}
    final_data = list(deduped.values())
    final_data.sort(key=lambda x: (x["sourceType"], x["title"].lower()))

    output_path.write_text(json.dumps(final_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(final_data)} urls to {output_path}")


if __name__ == "__main__":
    main()
