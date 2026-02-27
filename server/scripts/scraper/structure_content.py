import json
import re
from pathlib import Path
from typing import Dict, List, Optional


CHAPTER_MAP = {
    "pythagore": "pythagore",
    "thales": "thales",
    "trigonometrie": "trigonometrie",
    "calcul litteral": "calcul_litteral",
    "equation": "equations_inequations",
    "inequation": "equations_inequations",
    "fonction lineaire": "fonctions_lineaires_affines",
    "fonction affine": "fonctions_lineaires_affines",
    "application affine": "applications_affines",
    "puissance": "puissances_racines_carrees",
    "racine carree": "puissances_racines_carrees",
    "nombres entiers": "nombres_entiers_rationnels",
    "rationnels": "nombres_entiers_rationnels",
    "statistique": "statistiques_probabilites",
    "probabilite": "statistiques_probabilites",
    "angles inscrits": "angles_inscrits_polygones",
    "polygone": "angles_inscrits_polygones",
    "section de solides": "sections_solides",
    "pyramide": "pyramides_cones",
    "cone": "pyramides_cones",
    "sphere": "spheres_boules",
    "boule": "spheres_boules",
    "grandeurs composees": "grandeurs_composees",
}


def normalize_text(text: str) -> str:
    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    lines = [line.strip() for line in text.split("\n")]
    lines = [line for line in lines if line]
    return "\n\n".join(lines)


def strip_repeated_lines(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    freq: Dict[str, int] = {}
    for line in lines:
        freq[line] = freq.get(line, 0) + 1
    repeated = {line for line, count in freq.items() if count >= 8 and len(line) <= 120}
    cleaned = [line for line in lines if line not in repeated]
    return "\n".join(cleaned)


def find_chapter(title: str, content: str) -> Optional[str]:
    haystack = f"{title} {content[:2000]}".lower()
    for key, chapter in CHAPTER_MAP.items():
        if key in haystack:
            return chapter
    return None


def detect_source_type(path_name: str) -> str:
    lowered = path_name.lower()
    if "annale" in lowered or "bepc" in lowered:
        return "annale"
    if "exercice" in lowered:
        return "exercice"
    if "livre" in lowered or "namo" in lowered or "fascicule" in lowered:
        return "livre"
    return "cours"


def parse_year_zone(text: str) -> Dict[str, Optional[str]]:
    normalized = text.lower().replace("_", " ").replace("-", " ")
    year_match = re.search(r"(20\d{2}|19\d{2})", normalized)
    zone_match = re.search(r"(?:zone|zn)\s*([123])", normalized, flags=re.IGNORECASE)
    if not zone_match:
        zone_match = re.search(r"\b([123])\b", normalized) if "zone" in normalized else None
    return {
        "year": int(year_match.group(1)) if year_match else None,
        "zone": zone_match.group(1) if zone_match else None,
    }


def estimate_tokens(text: str) -> int:
    return len(text.split())


def split_long_content(text: str, max_tokens: int = 5000) -> List[str]:
    if estimate_tokens(text) <= max_tokens:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    chunks: List[str] = []
    current: List[str] = []
    current_tokens = 0

    for paragraph in paragraphs:
        p_tokens = estimate_tokens(paragraph)
        if current and current_tokens + p_tokens > max_tokens:
            chunks.append("\n\n".join(current))
            current = [paragraph]
            current_tokens = p_tokens
        else:
            current.append(paragraph)
            current_tokens += p_tokens

    if current:
        chunks.append("\n\n".join(current))
    return chunks


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return slug or "document"

def source_dir_name(source_type: str) -> str:
    mapping = {"cours": "cours", "exercice": "exercices", "annale": "annales", "livre": "livres"}
    return mapping.get(source_type, f"{source_type}s")


def build_output_name(source_type: str, chapter: Optional[str], title: str, index: int) -> str:
    base = chapter or slugify(title)
    if source_type == "livre" and index > 0:
        return f"{base}_part_{index + 1}.json"
    return f"{base}.json"


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    server_root = script_dir.parents[1]
    extracted_root = server_root / "data" / "extracted"
    output_root = server_root / "data" / "raw"

    if not extracted_root.exists():
        raise FileNotFoundError("Missing server/data/extracted. Run extract_text.py first.")

    for extracted_file in extracted_root.rglob("*.json"):
        payload = json.loads(extracted_file.read_text(encoding="utf-8"))
        relative_path = payload.get("relativePath", "")
        pdf_file = payload.get("pdfFile", extracted_file.stem)
        raw_content = payload.get("content", "")
        is_scanned = payload.get("isScanned", False)

        if is_scanned:
            print(f"Skip scanned file: {relative_path}")
            continue

        source_type = detect_source_type(relative_path)
        title = Path(pdf_file).stem.replace("_", " ").strip()
        cleaned = normalize_text(strip_repeated_lines(raw_content))
        chapter = find_chapter(title, cleaned)
        meta_year_zone = parse_year_zone(f"{title} {relative_path} {cleaned[:2000]}")

        parts = split_long_content(cleaned, max_tokens=5000 if source_type == "livre" else 9000)
        for index, part_content in enumerate(parts):
            final_title = title if len(parts) == 1 else f"{title} - part {index + 1}"
            document = {
                "sourceType": source_type,
                "subject": "mathematiques",
                "grade": "3eme",
                "chapter": chapter if source_type != "annale" else None,
                "title": final_title,
                "content": part_content,
                "metadata": {
                    "source": "fomesoutra",
                    "pdfFile": pdf_file,
                    "year": meta_year_zone["year"],
                    "zone": meta_year_zone["zone"],
                    "hasCorrection": "corrige" in cleaned.lower() or "correction" in cleaned.lower(),
                },
            }

            output_dir = output_root / source_dir_name(source_type)
            output_dir.mkdir(parents=True, exist_ok=True)

            output_name = build_output_name(source_type, document["chapter"], final_title, index)
            output_path = output_dir / output_name
            output_path.write_text(json.dumps(document, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"Structured -> {output_path.relative_to(server_root)}")


if __name__ == "__main__":
    main()
