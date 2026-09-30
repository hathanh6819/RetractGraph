"""Read-only probe for RetractGraph's exact public PubMed fixtures."""
import hashlib
import json
import re
import urllib.request

ENDPOINT = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id="
PAIRS = [
    {"purpose": "positive", "article": "27516793", "notice": "28515760", "expected": "RetractionOf"},
    {"purpose": "cross_object", "article": "27516793", "notice": "37086429", "expected": "NO_MATCH"},
]

def probe(item):
    url = ENDPOINT + item["article"] + "," + item["notice"]
    request = urllib.request.Request(url, headers={"Accept": "application/xml", "User-Agent": "RetractGraph/1.0 research-contact@example.org"})
    with urllib.request.urlopen(request, timeout=20) as response:
        raw = response.read(120001)
        status = response.status
    text = raw.decode("utf-8", errors="strict")
    present = set(re.findall(r"<PMID(?:\s[^>]*)?>([0-9]+)</PMID>", text))
    linked = bool(re.search(r'RefType="' + re.escape(item["expected"]) + r'"[^>]*>.*?<PMID(?:\s[^>]*)?>' + re.escape(item["article"]) + r'</PMID>', text, re.I | re.S)) if item["expected"] != "NO_MATCH" else False
    relation_tags = [{"type": kind, "pmid": pmid} for kind, pmid in re.findall(r'<CommentsCorrections[^>]*RefType="([^"]+)"[^>]*>.*?<PMID(?:\s[^>]*)?>([0-9]+)</PMID>.*?</CommentsCorrections>', text, re.I | re.S)]
    return {"purpose": item["purpose"], "url": url, "http_status": status, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(), "requested_pmids_present": item["article"] in present and item["notice"] in present, "expected_relation_found": linked, "relations": relation_tags}

if __name__ == "__main__":
    print(json.dumps([probe(item) for item in PAIRS], indent=2))
