import json
from pathlib import Path
from typing import Dict

import fitz


def extract_text(pdf_path: Path) -> str:
    if not pdf_path.exists() or pdf_path.stat().st_size == 0:
        raise ValueError("empty_file")
    doc = fitz.open(pdf_path)
    chunks = []
    for page in doc:
        chunks.append(page.get_text())
    doc.close()
    return "\n".join(chunks).strip()


def detect_scanned(text: str) -> bool:
    return len(text.strip()) < 50


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    server_root = script_dir.parents[1]
    pdf_root = server_root / "data" / "pdfs"
    output_root = server_root / "data" / "extracted"
    output_root.mkdir(parents=True, exist_ok=True)

    stats: Dict[str, int] = {"processed": 0, "scanned_skipped": 0}

    for pdf_path in pdf_root.rglob("*.pdf"):
        relative = pdf_path.relative_to(pdf_root)
        output_path = output_root / relative.with_suffix(".json")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if output_path.exists():
            continue

        print(f"Extracting {relative}")
        try:
            text = extract_text(pdf_path)
        except Exception as exc:
            payload = {
                "pdfFile": pdf_path.name,
                "relativePath": str(relative).replace("\\", "/"),
                "isScanned": True,
                "content": "",
                "error": str(exc),
            }
            output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            stats["processed"] += 1
            stats["scanned_skipped"] += 1
            print(f"  ! failed to extract: {relative} ({exc})")
            continue
        scanned = detect_scanned(text)

        payload = {
            "pdfFile": pdf_path.name,
            "relativePath": str(relative).replace("\\", "/"),
            "isScanned": scanned,
            "content": text,
        }
        output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

        stats["processed"] += 1
        if scanned:
            stats["scanned_skipped"] += 1
            print(f"  ! scanned or empty text: {relative}")

    print(
        f"Done. Extracted {stats['processed']} files, "
        f"scanned/empty detected: {stats['scanned_skipped']}"
    )


if __name__ == "__main__":
    main()
