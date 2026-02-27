import json
import re
from pathlib import Path
from typing import Dict, List
from urllib.parse import urlparse

import requests


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
)


def source_dir_name(source_type: str) -> str:
    mapping = {
        "cours": "cours",
        "exercice": "exercices",
        "annale": "annales",
        "livre": "livres",
    }
    return mapping.get(source_type, f"{source_type}s")


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", value).strip("_").lower()
    return slug or "document"


def infer_filename(title: str, url: str) -> str:
    base = slugify(title)
    suffix = Path(urlparse(url).path).stem
    if suffix and suffix.lower() not in {"file", ""}:
        base = f"{base}_{slugify(suffix)}"
    return f"{base[:120]}.pdf"


def download_file(url: str, destination: Path) -> Dict[str, str]:
    try:
        response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    except Exception as exc:
        return {"status": "failed", "reason": f"request_error:{exc}"}

    if response.status_code >= 400:
        return {"status": "failed", "reason": f"http_{response.status_code}"}

    content_type = response.headers.get("content-type", "").lower()
    if "pdf" not in content_type and not destination.name.lower().endswith(".pdf"):
        return {"status": "failed", "reason": f"non_pdf_content_type:{content_type}"}

    destination.write_bytes(response.content)
    return {"status": "ok", "reason": "downloaded"}


def main() -> None:
    script_dir = Path(__file__).resolve().parent
    server_root = script_dir.parents[1]
    urls_path = script_dir / "urls.json"
    pdf_root = server_root / "data" / "pdfs"
    report_path = script_dir / "download_report.json"
    failed_path = script_dir / "failed_urls.json"

    if not urls_path.exists():
        raise FileNotFoundError(f"Missing {urls_path}. Run scrape_urls.py first.")

    data = json.loads(urls_path.read_text(encoding="utf-8"))
    counts = {"cours": 0, "exercice": 0, "annale": 0, "livre": 0}
    downloaded = 0
    skipped_existing = 0
    failed = 0
    failures: List[Dict[str, str]] = []
    report_items: List[Dict[str, str]] = []

    for item in data:
        source_type = item.get("sourceType", "cours")
        title = item.get("title", "document")
        url = item.get("url")
        if not url:
            continue

        source_dir = pdf_root / source_dir_name(source_type)
        source_dir.mkdir(parents=True, exist_ok=True)

        filename = infer_filename(title, url)
        destination = source_dir / filename

        if destination.exists():
            skipped_existing += 1
            report_items.append(
                {
                    "url": url,
                    "title": title,
                    "sourceType": source_type,
                    "file": str(destination.relative_to(server_root)).replace("\\", "/"),
                    "status": "skipped_existing",
                    "reason": "already_exists",
                }
            )
            continue

        result = download_file(url, destination)
        status = result["status"]
        reason = result["reason"]

        if status == "ok":
            downloaded += 1
            counts[source_type] = counts.get(source_type, 0) + 1
            print(f"  -> downloaded {destination.name}")
            report_items.append(
                {
                    "url": url,
                    "title": title,
                    "sourceType": source_type,
                    "file": str(destination.relative_to(server_root)).replace("\\", "/"),
                    "status": "downloaded",
                    "reason": reason,
                }
            )
        else:
            failed += 1
            print(f"  ! failed {url} ({reason})")
            failure = {
                "url": url,
                "title": title,
                "sourceType": source_type,
                "reason": reason,
            }
            failures.append(failure)
            report_items.append({**failure, "status": "failed", "file": ""})

    summary = {
        "totalUrls": len(data),
        "downloaded": downloaded,
        "skippedExisting": skipped_existing,
        "failed": failed,
        "downloadedBySourceType": counts,
    }

    report_payload = {"summary": summary, "items": report_items}
    report_path.write_text(json.dumps(report_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    failed_path.write_text(json.dumps(failures, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        "Download summary: "
        f"downloaded={downloaded}, skipped_existing={skipped_existing}, failed={failed}"
    )
    print(f"Report written: {report_path}")
    print(f"Failed URLs written: {failed_path}")


if __name__ == "__main__":
    main()
