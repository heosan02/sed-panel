#!/usr/bin/env python3
"""
thumb_gen.py  —  SED Panel CEP v9.0
Fast thumbnail generator using cv2.VideoCapture (no per-frame FFmpeg overhead).
Called by host.jsx with a JSON jobs file. Returns JSON results to stdout.

Usage: python thumb_gen.py <jobs_json_path>

Jobs JSON format:
{
  "jobs": [
    {"idx": 0, "seekSec": 1.05, "srcPath": "C:\\path\\to\\video1.mp4", "outPath": "C:\\...\\sed_ff_001_1051.jpg"},
    ...
  ]
}

Output JSON (stdout):
{
  "ok": true,
  "results": [
    {"idx": 0, "ok": true,  "path": "C:\\...\\sed_ff_001_1051.jpg"},
    {"idx": 1, "ok": false, "path": ""}
  ]
}
"""
import sys
import json
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "msg": "No jobs file argument"}))
        sys.exit(1)

    jobs_path = sys.argv[1]
    if not os.path.isfile(jobs_path):
        print(json.dumps({"ok": False, "msg": "Jobs file not found: " + jobs_path}))
        sys.exit(1)

    try:
        with open(jobs_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(json.dumps({"ok": False, "msg": "JSON parse error: " + str(e)}))
        sys.exit(1)

    jobs = data.get("jobs", [])

    if not jobs:
        print(json.dumps({"ok": True, "results": []}))
        sys.exit(0)

    # Try cv2 first (fastest — single VideoCapture, no process per frame)
    try:
        import cv2
        results = _extract_with_cv2(jobs)
        print(json.dumps({"ok": True, "engine": "cv2", "results": results}))
        sys.exit(0)
    except ImportError:
        # cv2 not installed — report clearly so log shows the real reason
        sys.stderr.write("cv2 not available: opencv-python not installed for this Python version\n")
        pass  # fall through to FFmpeg
    except Exception as e:
        sys.stderr.write("cv2 failed: " + str(e) + "\n")

    # Fallback: FFmpeg (one process per frame — slower but always available)
    import shutil
    import subprocess
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print(json.dumps({"ok": False, "msg": "Neither cv2 nor ffmpeg available"}))
        sys.exit(1)

    results = _extract_with_ffmpeg(jobs, ffmpeg)
    print(json.dumps({"ok": True, "engine": "ffmpeg", "results": results}))
    sys.exit(0)


def _extract_with_cv2(jobs):
    """
    Multi-source VideoCapture. Groups by srcPath to minimize re-opens.
    Sorted by seekSec per source group.
    JPEG quality 85, max width 320px — fast and small.
    """
    import cv2

    THUMB_W = 320
    JPEG_QUALITY = 85

    results = []

    # Group jobs by source path
    source_groups = {}
    for job in jobs:
        src = job.get("srcPath", "")
        if src not in source_groups:
            source_groups[src] = []
        source_groups[src].append(job)

    for src, group_jobs in source_groups.items():
        if not src or not os.path.isfile(src):
            for j in group_jobs:
                results.append({"idx": j["idx"], "ok": False, "path": ""})
            continue

        # Sort by seekSec per source — reduces random seeks
        sorted_jobs = sorted(group_jobs, key=lambda j: j["seekSec"])

        cap = cv2.VideoCapture(src)
        if not cap.isOpened():
            for j in group_jobs:
                results.append({"idx": j["idx"], "ok": False, "path": ""})
            continue

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        result_map = {}

        for job in sorted_jobs:
            idx = job["idx"]
            seek = job["seekSec"]
            out = job["outPath"]

            try:
                target_frame = int(seek * fps)
                cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
                ret, frame = cap.read()
                if not ret:
                    result_map[idx] = {"idx": idx, "ok": False, "path": ""}
                    continue

                # Resize to max 320px wide, maintain aspect ratio
                h, w = frame.shape[:2]
                if w > THUMB_W:
                    scale = THUMB_W / w
                    new_w = THUMB_W
                    new_h = max(1, int(h * scale))
                    frame = cv2.resize(frame, (new_w, new_h),
                                       interpolation=cv2.INTER_AREA)

                # Ensure output directory exists
                out_dir = os.path.dirname(out)
                if out_dir and not os.path.exists(out_dir):
                    os.makedirs(out_dir, exist_ok=True)

                # Write JPEG
                ok = cv2.imwrite(out, frame,
                                 [cv2.IMWRITE_JPEG_QUALITY, JPEG_QUALITY])
                if ok and os.path.isfile(out) and os.path.getsize(out) > 100:
                    result_map[idx] = {"idx": idx, "ok": True, "path": out}
                else:
                    result_map[idx] = {"idx": idx, "ok": False, "path": ""}
            except Exception as e:
                result_map[idx] = {"idx": idx, "ok": False, "path": "",
                                   "err": str(e)}

        cap.release()

        # Append in original job order
        for j in group_jobs:
            results.append(result_map.get(j["idx"],
                           {"idx": j["idx"], "ok": False, "path": ""}))

    return results


def _extract_with_ffmpeg(jobs, ffmpeg_path):
    """Fallback: one FFmpeg process per frame, supports per-job srcPath."""
    import subprocess
    results = []
    for job in jobs:
        idx = job["idx"]
        seek = job["seekSec"]
        src = job.get("srcPath", "")
        out = job["outPath"]
        try:
            if not src or not os.path.isfile(src):
                results.append({"idx": idx, "ok": False, "path": "",
                                "err": "source not found"})
                continue
            out_dir = os.path.dirname(out)
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)
            cmd = [
                ffmpeg_path,
                "-ss", f"{seek:.4f}",
                "-i", src,
                "-vf", "scale=320:-2",
                "-frames:v", "1",
                "-q:v", "3",
                "-loglevel", "error",
                "-y", out
            ]
            subprocess.run(cmd, capture_output=True, timeout=15)
            ok = os.path.isfile(out) and os.path.getsize(out) > 100
            results.append({"idx": idx, "ok": ok, "path": out if ok else ""})
        except Exception as e:
            results.append({"idx": idx, "ok": False, "path": "", "err": str(e)})
    return results


if __name__ == "__main__":
    main()
