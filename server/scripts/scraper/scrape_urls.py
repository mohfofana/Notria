import argparse
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.fomesoutra.com"
DEFAULT_SOURCE_PAGES: List[Tuple[str, str]] = [
    ("livre", f"{BASE_URL}/les-livres/livres-et-annales-de-la-troisieme?limit=100"),
    ("annale", "https://www.banquedesepreuves.com/index.php/component/edocman/cote-d-ivoire/bepc"),
    ("annale", "https://epreuvesetcorriges.com/categories/cote-d-ivoire/examens/bepc"),
    ("annale", "https://sujetcorrige.com/sujets-bepc-cote-d-ivoire"),
]

SUBJECT_CONFIGS: Dict[str, Dict[str, object]] = {
    "mathematiques": {
        "aliases": ["math", "mathem", "pythagore", "thales", "trigono", "equation"],
        "source_pages": [
            ("exercice", f"{BASE_URL}/cours/secondaire/3eme/maths"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/calcul-litteral-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/calculs-numeriques-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/configuration-de-l-espace-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/geometrie-analytique-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/pyramides-et-cones-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/guide-pedagogique-cours-de-maths-3eme/configuration-du-plan-guide-pedagogique-maths-3eme?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/maths/mathematiques-3ieme-apc"),
        ],
    },
    "francais": {
        "aliases": ["francais", "grammaire", "conjugaison", "dictee", "redaction", "resume", "composition"],
        "source_pages": [
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/cours-de-francais-3eme?sort=title&limit=100"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/cours-de-francais-3eme"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme?limit=100"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/anciens-sujets-de-composition-francaise-du-bepc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/sujets-de-composition-francaise-bepc-blanc-lycee-sainte-marie-de-cocody"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/sujets-de-composition-francaise-bepc-blanc-empt-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/sujets-de-composition-francaise-bepc-blanc-lycee-mamie-faitai-de-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/sujets-de-composition-francaise-bepc-blanc-drenet-ferkessedougou"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/sujets-de-composition-francaise-groupe-scolaire-sainte-foi"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-composition-francaise-3eme/examens-blancs-3e-1"),
        ],
    },
    "anglais": {
        "aliases": ["anglais", "english", "grammar", "vocabulary", "reading", "essay"],
        "source_pages": [
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/anglais?limit=100"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/anglais"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/anglais/anglais-3ieme-apc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme?limit=100"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme/anciens-sujets-d-anglais-du-bepc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme/sujets-d-anglais-bepc-blanc-lycee-sainte-marie-de-cocody"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme/sujets-d-anglais-bepc-blanc-empt-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme/sujets-danglais-niveau-troisieme"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-d-anglais-3eme/interrogations-et-devoirs-danglais-3ieme"),
        ],
    },
    "svt": {
        "aliases": ["svt", "biologie", "cellule", "nutrition", "reproduction", "science de la vie"],
        "source_pages": [
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme/anciens-sujets-de-svt-du-bepc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme/sujets-de-svt-bepc-blancs-lycee-sainte-marie-de-cocody"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme/sujets-de-svt-bepc-blanc-empt-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme/sujets-de-svt-bepc-blanc-lycee-mamie-faitai-de-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-svt-3eme/sujets-svt-3ieme?limit=100"),
        ],
    },
    "physique-chimie": {
        "aliases": ["physique", "chimie", "electricite", "optique", "mecanique"],
        "source_pages": [
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme/physique-1"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme/chimie-1"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme/chimie-1/chimie-3ieme-apc?sort=title"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme/physique-1/supports-cours-de-physique-3eme"),
            ("cours", f"{BASE_URL}/cours/secondaire/3eme/dossier-cours-de-physique-chimie-3eme/physique-1/physique-3ieme-apc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/anciens-sujets-de-physique-chimie-du-bepc"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/sujets-de-physique-chimie-bepc-blanc-lycee-sainte-marie-de-cocody"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/sujets-de-physique-chimie-bepc-blanc-empt-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/sujets-de-physique-chimie-bepc-blanc-lycee-mamie-houphouet-fetai-de-bingerville"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/tp-et-devoirs-de-physique-chimie-niveau-3eme"),
            ("annale", f"{BASE_URL}/sujets/secondaire-1/troisieme/sujets-de-physique-chimie-3eme/fiche-d-exercices-en-physique-chimie"),
        ],
    },
}

COMMON_EXAM_ALIASES = ["bepc", "annale", "zone", "sujet"]
SUBJECT_BLACKLIST = {
    "math",
    "mathem",
    "physique",
    "chimie",
    "svt",
    "francais",
    "histoire",
    "geographie",
    "anglais",
    "espagnol",
    "allemand",
    "philosophie",
}

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)


def is_pdf_candidate(url: str) -> bool:
    lowered = url.lower()
    pdf_markers = [".pdf", "/file", "download", "/edocman/", "task=document.download"]
    return any(marker in lowered for marker in pdf_markers)


def is_subject_candidate(title: str, url: str, subject_slug: str) -> bool:
    subject_conf = SUBJECT_CONFIGS[subject_slug]
    subject_aliases = list(subject_conf.get("aliases", []))
    haystack = f"{title} {url}".lower()
    positive = subject_aliases + COMMON_EXAM_ALIASES
    has_subject_marker = any(alias in haystack for alias in subject_aliases)
    has_exam_marker = any(alias in haystack for alias in COMMON_EXAM_ALIASES)
    if not any(keyword in haystack for keyword in positive):
        return False
    if not (has_subject_marker or (has_exam_marker and subject_slug == "mathematiques")):
        return False

    if has_subject_marker:
        blacklist = set(SUBJECT_BLACKLIST) - set(subject_aliases)
        if any(keyword in haystack for keyword in blacklist):
            return False
    return True


def is_bepc_3eme_candidate(title: str, url: str) -> bool:
    haystack = f"{title} {url}".lower()
    level_markers = ["3eme", "troisieme", "3e", "bepc", "zone"]
    return any(marker in haystack for marker in level_markers)


def passes_strict_filters(source_type: str, title: str, url: str, subject_slug: str) -> bool:
    if not is_subject_candidate(title, url, subject_slug):
        return False
    if not is_bepc_3eme_candidate(title, url):
        return False
    if source_type == "annale":
        haystack = f"{title} {url}".lower()
        if "bepc" not in haystack and "zone" not in haystack and "blanc" not in haystack:
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


def should_crawl_doc_page(link_url: str, source_type: str, subject_slug: str) -> bool:
    lowered = link_url.lower()
    if source_type != "annale":
        return False
    subject_conf = SUBJECT_CONFIGS[subject_slug]
    subject_aliases = list(subject_conf.get("aliases", []))
    markers = ["bepc", "zone", "sujet", "edocman", "blanc"] + subject_aliases
    return any(marker in lowered for marker in markers) and "download" not in lowered


def collect_links(page_html: str, page_url: str, source_type: str, subject_slug: str) -> List[Dict[str, str]]:
    soup = BeautifulSoup(page_html, "html.parser")
    seen: Set[str] = set()
    results: List[Dict[str, str]] = []
    doc_pages: Set[str] = set()

    for anchor in soup.find_all("a", href=True):
        href = anchor["href"].strip()
        absolute_url = urljoin(page_url, href)
        title_text = derive_link_title(anchor, absolute_url)

        if source_type in {"livre", "annale", "exercice", "cours"} and not passes_strict_filters(
            source_type, title_text, absolute_url, subject_slug
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

        if should_crawl_doc_page(absolute_url, source_type, subject_slug):
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
            if source_type in {"livre", "annale", "exercice", "cours"} and not passes_strict_filters(
                source_type, title, doc_url, subject_slug
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape BEPC PDF URLs by subject")
    parser.add_argument(
        "--subject",
        choices=sorted(SUBJECT_CONFIGS.keys()),
        default="mathematiques",
        help="Subject slug to scrape",
    )
    return parser.parse_args()


def resolve_source_pages(subject_slug: str) -> List[Tuple[str, str]]:
    subject_pages = list(SUBJECT_CONFIGS[subject_slug]["source_pages"])  # type: ignore[index]
    merged = subject_pages + DEFAULT_SOURCE_PAGES
    deduped: List[Tuple[str, str]] = []
    seen: Set[Tuple[str, str]] = set()
    for entry in merged:
        if entry in seen:
            continue
        seen.add(entry)
        deduped.append(entry)
    return deduped


def main() -> None:
    args = parse_args()
    subject_slug = args.subject
    script_dir = Path(__file__).resolve().parent
    output_path = script_dir / f"urls_{subject_slug}.json"
    source_pages = resolve_source_pages(subject_slug)

    all_links: List[Dict[str, str]] = []
    for source_type, page_url in source_pages:
        print(f"Scraping {source_type}: {page_url}")
        try:
            html = fetch_html(page_url)
            links = collect_links(html, page_url, source_type, subject_slug)
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
