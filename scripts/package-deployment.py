"""Zip only the generated LiteSpeed manifest entries, with dist contents at ZIP root."""

from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

project = Path(__file__).resolve().parent.parent
dist = project / "dist"
manifest = project / "docs" / "litespeed-dist-manifest.txt"
release = project / "release"
archive = release / "konusmatik-final-HOLD.zip"

files = [line.strip() for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
if not files or ".htaccess" not in files:
    raise SystemExit("Manifest is empty or .htaccess is missing; run npm run deploy:manifest")
if len(files) != len(set(files)):
    raise SystemExit("Duplicate manifest paths")

for relative in files:
    candidate = (dist / relative).resolve()
    if not candidate.is_relative_to(dist.resolve()) or not candidate.is_file():
        raise SystemExit(f"Invalid or missing deployment path: {relative}")

release.mkdir(exist_ok=True)
with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as output:
    for relative in files:
        output.write(dist / relative, arcname=relative)

with ZipFile(archive) as output:
    if set(output.namelist()) != set(files) or output.testzip() is not None:
        raise SystemExit("ZIP verification failed")

print(f"Created {archive} ({len(files)} files). HOLD: legal approval and document root verification are pending.")
