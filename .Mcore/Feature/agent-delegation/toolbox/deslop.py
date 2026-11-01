#!/usr/bin/env python3
"""
SlopMonster (tools/deslop.py) - Dependency-free AI writing pattern checker.
Evaluates English copy across 5 categories. Each category with a match costs 1 point.
Scores 5/5 if clean (exits 0). Scores <5 if patterns detected (exits 1).
"""
import sys
import re
import argparse

VOICED_CLICHES = [
    r"\bdelve(?:s|d|ing)?\b", r"\btapestry\b", r"\bbeacon\b", r"\bgame-?changer\b",
    r"\btestament\b", r"\bpivotal\b", r"\bfoster(?:s|ed|ing)?\b", r"\bleverage(?:s|d|ing)?\b",
    r"\brobust(?:ness)?\b", r"\bseamless(?:ly)?\b", r"\bunlock(?:s|ed|ing)?\b",
    r"\belevat(?:e|es|ed|ing)\b", r"\btransformative\b", r"\bgroundbreaking\b",
    r"\bnavigat(?:e|es|ed|ing) the (?:complex|landscape)\b", r"\bin today's fast-paced\b",
    r"\bparadigm shift\b", r"\bholistic(?:ally)?\b", r"\bsynerg(?:y|ies|istic)?\b",
    r"\bcornerstone\b", r"\blinspin\b", r"\bmeticulous(?:ly)?\b", r"\bvibrant\b"
]

SENTENCE_PATTERNS = [
    r"\bnot only\b.+?\bbut also\b",
    r"\bnot just\b.+?\bbut\b",
    r"\b(?:it is|it's) important to (?:remember|note|consider)\b",
    r"\b(?:let's|let us) delve into\b",
    r"\bwhy does this matter\?\b",
    r"\bwhat does this mean\?\b"
]

def check_vocabulary(text):
    matches = []
    for pat in VOICED_CLICHES:
        for m in re.finditer(pat, text, re.IGNORECASE):
            matches.append(m.group(0))
    return matches

def check_sentence_patterns(text):
    matches = []
    for pat in SENTENCE_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            matches.append(m.group(0))
    return matches

def check_punctuation(text):
    issues = []
    em_dashes = len(re.findall(r"—|--", text))
    if em_dashes >= 3:
        issues.append(f"Clustered em-dashes/hyphen dividers ({em_dashes} occurrences)")
    semicolons = len(re.findall(r";", text))
    if semicolons >= 4:
        issues.append(f"High semicolon density ({semicolons} occurrences)")
    return issues

def check_three_item_lists(text):
    # Detect formulaic "X, Y, and Z" clusters
    pattern = r"\b(?:[a-zA-Z\-]+),\s+(?:[a-zA-Z\-]+),\s+and\s+(?:[a-zA-Z\-]+)\b"
    matches = re.findall(pattern, text)
    if len(matches) >= 3:
        return [f"Formulaic tricolon clusters ({len(matches)} found)"]
    return []

def check_unsupported_proof(text, allow_proof=False):
    if allow_proof:
        return []
    # e.g., 99.9%, 10x, 500k+ users without citation
    pattern = r"\b(?:\d+%(?:\s+increase|\s+improvement|\s+reduction)?|\d+x|\d+\+?\s+(?:users|customers|companies|enterprises))\b"
    matches = re.findall(pattern, text, re.IGNORECASE)
    if len(matches) >= 2:
        return [f"Unverified number-noun claims: {', '.join(matches[:3])}"]
    return []

def main():
    parser = argparse.ArgumentParser(description="SlopMonster Copy Linter")
    parser.add_argument("file", nargs="?", help="File to check")
    parser.add_argument("--text", help="Direct text to check")
    parser.add_argument("--allow-proof", action="store_true", help="Allow cited metrics")
    args = parser.parse_args()

    content = ""
    if args.text:
        content = args.text
    elif args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e:
            print(f"Error reading file: {e}")
            sys.exit(2)
    else:
        content = sys.stdin.read()

    if not content.strip():
        print("Empty input. Score: 0/5")
        sys.exit(1)

    voc_hits = check_vocabulary(content)
    pat_hits = check_sentence_patterns(content)
    punc_hits = check_punctuation(content)
    tri_hits = check_three_item_lists(content)
    proof_hits = check_unsupported_proof(content, args.allow_proof)

    score = 5
    penalties = []
    if voc_hits:
        score -= 1
        penalties.append(f"[-1] Vocabulary (clichés): {', '.join(set(voc_hits[:5]))}")
    if pat_hits:
        score -= 1
        penalties.append(f"[-1] Sentence Patterns (formulaic hedges/rhetoric): {len(pat_hits)} detected")
    if punc_hits:
        score -= 1
        penalties.append(f"[-1] Punctuation: {', '.join(punc_hits)}")
    if tri_hits:
        score -= 1
        penalties.append(f"[-1] Three-item lists: {', '.join(tri_hits)}")
    if proof_hits:
        score -= 1
        penalties.append(f"[-1] Unsupported proof: {', '.join(proof_hits)}")

    print(f"SlopMonster Score: {score}/5")
    for p in penalties:
        print(f"  * {p}")

    if score == 5:
        print("PASS: Copy is clean, direct, and unbloated.")
        sys.exit(0)
    else:
        print("FAIL: Edit copy to resolve detected patterns.")
        sys.exit(1)

if __name__ == "__main__":
    main()
