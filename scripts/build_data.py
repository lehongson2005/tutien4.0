from __future__ import annotations

import json
import pathlib
import re
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web_game" / "src" / "data" / "generated"

# ---------------------------------------------------------------------------
# Text normalization helpers (never mutate source .txt files)
# ---------------------------------------------------------------------------

LATEX_REPLACEMENTS = [
    (r"\$\\rightarrow\$", "->"),
    (r"\$1000\^\\circ\\text\{C\}\$", "1000°C"),
    (r"\$360\^\\circ\$", "360°"),
    (r"\$([^$]+)\$", r"\1"),
]


def clean_text(text: str) -> str:
    s = text.strip()
    for pat, rep in LATEX_REPLACEMENTS:
        s = re.sub(pat, rep, s)
    s = re.sub(r"\s+", " ", s)
    # Fix small OCR/typo artifacts found in raw lore/event txt files
    replacements = [
        ("v vực", "vực"),
        ("S搜", "Sưu"),
        ("逍遥", "Tiêu Dao"),
        ("信仰", "Tín Ngưỡng"),
        ("b bẩm sinh", "bẩm sinh"),
        ("l tống tiền", "để tống tiền"),
        ("50% th thọ nguyên", "50% thọ nguyên"),
        ("B đóa hoa sen", "Đóa hoa sen"),
    ]
    for old, new in replacements:
        s = s.replace(old, new)
    s = re.sub(r"^(?:V\s+)(?=Vực|Vô|Thủy|Tâm)", "", s)
    s = re.sub(r"^m Dương\b", "Âm Dương", s)
    s = re.sub(r"(?<=[.(:\s])m Dương\b", "Âm Dương", s)
    return s.strip()


def infer_realm_tier(index: int, total: int, label_hint: str = "") -> str:
    h = label_hint.lower()
    if "thần giới" in h or "chí cao" in h or "thần minh" in h or "thần cấp" in h:
        return "than_gioi"
    if "tiên giới" in h or "tiên nhân" in h or "tiên cấp" in h:
        return "tien_gioi"
    if "hạ giới" in h or "tu chân" in h or "phàm" in h:
        return "ha_gioi"
    if index >= int(total * 0.68):
        return "than_gioi"
    if index >= int(total * 0.34):
        return "tien_gioi"
    return "ha_gioi"


def infer_rarity(idx: int, total: int, tier_hint: str = "") -> str:
    h = tier_hint.lower()
    if "chí cao" in h or "chí tôn" in h or "tuyệt thế" in h or "vô thượng" in h:
        return "chi_ton"
    if "thánh" in h or "tiên" in h or "thần" in h:
        return "thanh"
    ratio = idx / max(total, 1)
    if ratio < 0.25:
        return "pham"
    if ratio < 0.55:
        return "linh"
    if ratio < 0.78:
        return "vuong"
    if ratio < 0.92:
        return "thanh"
    return "chi_ton"


# ---------------------------------------------------------------------------
# Generic & specialized parsers for the 36 lore files
# ---------------------------------------------------------------------------

SECTION_RE = re.compile(
    r"^(?:[IVX]+\.\s|Đây là|Dưới đây|\d+\.\s|\d+\s*-\s*\d+\s*[:.])"
)


def parse_multiline_colon(
    filename: str, prefix: str, expected_limit: int | None = None
) -> list[dict[str, Any]]:
    path = ROOT / filename
    lines = [l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    entries: list[dict[str, Any]] = []
    current_group = "Chung"

    for line in lines:
        if SECTION_RE.match(line):
            current_group = clean_text(line)
            continue
        if ":" not in line:
            current_group = clean_text(line)
            continue
        raw_name, raw_desc = line.split(":", 1)
        if len(raw_name.strip()) > 95:
            continue
        name = clean_text(raw_name)
        desc = clean_text(raw_desc)
        if not name or not desc:
            continue
        # Strip noisy "Phân nhóm (...)" lines that ended up with a colon
        if re.match(r"^\d+\s*-\s*\d+", name):
            current_group = f"{name}: {desc}"
            continue
        entries.append(
            {
                "id": f"{prefix}_{len(entries) + 1:03d}",
                "name": name,
                "description": desc,
                "group": current_group,
            }
        )
        if expected_limit and len(entries) >= expected_limit:
            break

    total = max(len(entries), 1)
    for idx, item in enumerate(entries):
        tier = infer_realm_tier(idx, total, item["group"] + " " + item["name"])
        rarity = infer_rarity(idx, total, item["group"] + " " + item["name"])
        item["tier"] = tier
        item["rarity"] = rarity
    return entries


def parse_singleline_entries(
    filename: str,
    prefix: str,
    strip_prefixes: list[str] | None = None,
    ignore_titles: set[str] | None = None,
) -> list[dict[str, Any]]:
    raw = (ROOT / filename).read_text(encoding="utf-8")
    text = raw.replace("\r", " ").replace("\n", " ")
    if strip_prefixes:
        for sp in strip_prefixes:
            text = text.replace(sp, "")
    text = clean_text(text)

    # Known embedded headings in single-line files
    heading_phrases = [
        "Thảm Họa Khí Hậu & Thời Tiết (15 Hiện Tượng)",
        "Địa Hình Đặc Thù Nguy Hiểm (15 Địa Danh)",
        "Các Dạng Khí Vận (15 Loại)",
        "Các Loại Mệnh Cách Định Mệnh (15 Loại)",
        "Nhóm Chế Tạo & Rèn Đúc (10 Nghề)",
        "Nhóm Nuôi Dưỡng & Sinh Vật (10 Nghề)",
        "Nhóm Thu Thập & Khai Thác (10 Nghề)",
        "I. Phàm Giới Lôi Kiếp (Dành cho tu sĩ Luyện Khí -> Đại Thừa)",
        "II. Tiên Giới Thiên Phạt (Dành cho Nhân Tiên -> Tiên Đế)",
        "III. Thần Giới Chí Cao Lôi Phạt (Dành cho cấp Thần -> Vô Thượng Siêu Thoát)",
        "⚖️ Hệ Thống Phân Cấp Thần Thông",
        "I. Nhóm Thần Thông Thời Gian & Không Gian (Chí Cao Vô Thượng)",
        "Nắm giữ hai quy luật tối cao của vũ trụ, kẻ sở hữu những chiêu này luôn là vô địch cùng cấp.",
        "II. Nhóm Thần Thông Nhục Thân & Biến Hình (Nghịch Thiên Cải Mệnh)",
        "Biến cơ thể thành vũ khí tối thượng, nhục thân thành thánh.",
        "III. Nhóm Thần Thông Công Kích & Sát Lục (Hủy Diệt Vạn Vật)",
        "Chiêu thức thuần sát thương, sinh ra để đồ sát và diệt môn.",
        "IV. Nhóm Thần Thông Tinh Thần & Linh Hồn (Khống Chế Trầm Luân)",
        "Tấn công thẳng vào não bộ và thần thức, khiến kẻ địch tự sát hoặc hóa điên.",
        "V. Nhóm Thần Thông Phòng Ngự & Trị Liệu (Bất Tử Vực)",
        "Càng đánh càng khỏe, khiên dày như tường thành.",
        "VI. 50 Đại Thần Thông Độc Lạ, Biến Dị Khác (Tạo điểm nhấn kịch tính)",
        "51 - 65: Thần thông hệ Ngũ Hành biến dị",
        "66 - 80: Thần thông nhân quả, khí vận & Bí thuật ngầm",
        "81 - 100: Thần thông Thượng Cổ Chủng Tộc & Dị Giới",
    ]
    for hp in heading_phrases:
        text = text.replace(hp, f"\n@@HEAD@@{hp}\n")

    # Split at sentence boundary `.` or `)` immediately followed by Title:
    boundary_re = re.compile(
        r"(?:^|(?<=[.)])|(?<=\n))([^:.()\n]{2,65}(?:\([^)\n]+\))?)\s*:\s*"
    )
    matches = list(boundary_re.finditer(text))
    entries: list[dict[str, Any]] = []
    ignore = ignore_titles or set()
    current_group = "Chung"

    for i, m in enumerate(matches):
        title = clean_text(m.group(1).replace("@@HEAD@@", ""))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        desc_raw = text[start:end]
        if "@@HEAD@@" in desc_raw:
            parts = desc_raw.split("@@HEAD@@")
            desc_raw = parts[0]
            current_group = clean_text(parts[-1])
        desc = clean_text(desc_raw)
        if not title or title in ignore or len(title) > 85:
            continue
        if title.startswith("51 -") or title.startswith("66 -") or title.startswith("81 -"):
            continue
        entries.append(
            {
                "id": f"{prefix}_{len(entries) + 1:03d}",
                "name": title,
                "description": desc,
                "group": current_group,
            }
        )

    total = max(len(entries), 1)
    for idx, item in enumerate(entries):
        item["tier"] = infer_realm_tier(idx, total, item["group"] + " " + item["name"])
        item["rarity"] = infer_rarity(idx, total, item["name"])
    return entries


def build_realms() -> list[dict[str, Any]]:
    parsed = parse_multiline_colon("canhgioi.txt", "realm", expected_limit=30)
    # Canonical maxAge (matching tuoitho.txt) & tuViCap progression
    max_ages = [
        90,        # 0 Phàm nhân
        150,       # 1 Luyện Khí
        300,       # 2 Trúc Cơ
        800,       # 3 Kết Đan / Kim Đan
        1500,      # 4 Nguyên Anh
        5000,      # 5 Hóa Thần
        15000,     # 6 Luyện Hư
        30000,     # 7 Hợp Thể
        60000,     # 8 Độ Kiếp
        100000,    # 9 Đại Thừa
        250000,    # 10 Bán Tiên
        1000000,   # 11 Nhân Tiên
        1800000,   # 12 Địa Tiên
        3000000,   # 13 Thiên Tiên
        5000000,   # 14 Huyền Tiên
        10000000,  # 15 Đại La Kim Tiên
        50000000,  # 16 Tiên Vương
        75000000,  # 17 Tiên Tôn
        100000000, # 18 Tiên Đế
        200000000, # 19 Chuẩn Thần
        400000000, # 20 Á Thần
        1000000000, # 21 Hạ Vị Thần
        3000000000, # 22 Trung Vị Thần
        10000000000, # 23 Thượng Vị Thần
        30000000000, # 24 Thần Vương
        80000000000, # 25 Thần Đế
        200000000000, # 26 Cổ Thần
        500000000000, # 27 Hỗn Độn Cảnh
        900000000000, # 28 Nghịch Thiên Cảnh
        2000000000000, # 29 Đại Đạo Chí Cao
        9999999999999, # 30 Siêu Thoát Cảnh
    ]
    tu_vi_caps = [
        100, 260, 650, 1500, 3400, 7500, 16000, 32000, 64000, 125000, 240000,
        450000, 820000, 1500000, 2800000, 5200000, 9500000, 18000000, 34000000, 64000000, 120000000,
        240000000, 480000000, 960000000, 1900000000, 3800000000, 7600000000, 15000000000, 30000000000, 60000000000, 120000000000,
    ]
    realms: list[dict[str, Any]] = [
        {
            "index": 0,
            "id": "realm_00",
            "name": "Phàm Nhân",
            "description": "Chưa bước vào con đường tu chân, sống nương tựa vào khí huyết phàm trần.",
            "tier": "ha_gioi",
            "maxAge": max_ages[0],
            "tuViCap": tu_vi_caps[0],
            "powerBase": 10,
            "requiresTamMa": False,
            "requiresLoiKiep": False,
        }
    ]
    for i, item in enumerate(parsed, start=1):
        tier = "ha_gioi" if i <= 10 else ("tien_gioi" if i <= 20 else "than_gioi")
        realms.append(
            {
                "index": i,
                "id": f"realm_{i:02d}",
                "name": item["name"],
                "description": item["description"],
                "tier": tier,
                "maxAge": max_ages[i],
                "tuViCap": tu_vi_caps[i],
                "powerBase": int(20 * (1.85 ** i)),
                "requiresTamMa": i >= 2,
                "requiresLoiKiep": i >= 3,
            }
        )
    return realms


def build_regions() -> list[dict[str, Any]]:
    raw_lines = [
        l.strip()
        for l in (ROOT / "theluc.txt").read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]
    regions: list[dict[str, Any]] = []
    tier = "ha_gioi"
    # Parse both numbered regions (Hạ Giới) and Colon regions (Tiên/Thần Giới)
    i = 0
    while i < len(raw_lines):
        line = clean_text(raw_lines[i])
        if "HẠ GIỚI" in line:
            tier = "ha_gioi"
        elif "TIÊN GIỚI" in line:
            tier = "tien_gioi"
        elif "THẦN GIỚI" in line:
            tier = "than_gioi"
        elif re.match(r"^\d+\.\s+", line):
            name = re.sub(r"^\d+\.\s+", "", line)
            desc_parts = []
            j = i + 1
            while j < len(raw_lines) and not re.match(
                r"^(\d+\.|I+\.)", raw_lines[j].strip()
            ):
                if ":" in raw_lines[j]:
                    desc_parts.append(clean_text(raw_lines[j]))
                j += 1
            regions.append(
                {
                    "id": f"region_{len(regions) + 1:02d}",
                    "name": name,
                    "tier": tier,
                    "description": " | ".join(desc_parts) or name,
                    "dangerLevel": 1 if "Đông" in name else (3 if "Trung" in name else 2),
                }
            )
            i = j
            continue
        elif ":" in line and not line.startswith("Đặc trưng") and tier in ("tien_gioi", "than_gioi"):
            name, desc = line.split(":", 1)
            if len(name) < 70:
                regions.append(
                    {
                        "id": f"region_{len(regions) + 1:02d}",
                        "name": clean_text(name),
                        "tier": tier,
                        "description": clean_text(desc),
                        "dangerLevel": 4 if tier == "tien_gioi" else 6,
                    }
                )
        i += 1
    return regions


def build_sect_ranks() -> list[dict[str, Any]]:
    ranks: list[dict[str, Any]] = []
    for fname, role_type in [("detu.txt", "de_tu"), ("truonglao.txt", "truong_lao")]:
        lines = [
            l.strip()
            for l in (ROOT / fname).read_text(encoding="utf-8").splitlines()
            if l.strip()
        ]
        idx = 0
        for line in lines:
            if re.match(r"^\d+\.\s+", line):
                idx += 1
                title = clean_text(re.sub(r"^\d+\.\s+", "", line))
                ranks.append(
                    {
                        "id": f"{role_type}_{idx}",
                        "rankOrder": len(ranks) + 1,
                        "roleType": role_type,
                        "name": title,
                        "minRealm": (idx - 1) if role_type == "de_tu" else (idx + 1),
                        "salaryMultiplier": round(1.0 + len(ranks) * 0.45, 2),
                    }
                )
    return ranks


def enrich_origins(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for idx, item in enumerate(items):
        g = item["group"].lower()
        name_desc = (item["name"] + " " + item["description"]).lower()
        bonuses = {
            "nhucThan": 2,
            "ngoTinh": 2,
            "tamCanh": 2,
            "khiVan": 0,
            "linhThach": 15,
            "congDuc": 0,
            "nghiepLuc": 0,
        }
        bias = "random"
        if "nghèo" in g or "phàm" in g:
            bonuses["nhucThan"] += 5
            bonuses["tamCanh"] += 5
            bonuses["linhThach"] = 5
            item["rarity"] = "pham"
        elif "phế vật" in g or "bi kịch" in g:
            bonuses["tamCanh"] += 8
            bonuses["nghiepLuc"] += 5
            item["rarity"] = "linh"
        elif "trọng sinh" in g or "xuyên" in name_desc or "đại lão" in g:
            bonuses["ngoTinh"] += 12
            bonuses["khiVan"] += 10
            bonuses["linhThach"] = 50
            item["rarity"] = "vuong"
            bias = "high"
        elif "yêu tộc" in g or "dị" in g:
            bonuses["nhucThan"] += 10
            bonuses["khiVan"] += 5
            item["rarity"] = "vuong"
        elif "thần bí" in g:
            bonuses["ngoTinh"] += 6
            bonuses["khiVan"] += 12
            item["rarity"] = "thanh"
        if "may mắn" in name_desc or "vĩnh hằng" in name_desc:
            bonuses["khiVan"] += 20
            item["rarity"] = "chi_ton"
        item["bonuses"] = bonuses
        item["spiritRootBias"] = bias
    return items


def enrich_physiques(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for idx, item in enumerate(items):
        if idx < 25:
            item["rarity"] = "chi_ton"
            item["tuViMultiplier"] = 1.65
            item["nhucThanBonus"] = 18
            item["ngoTinhBonus"] = 14
            item["powerBonus"] = 120
        elif idx < 75:
            item["rarity"] = "vuong"
            item["tuViMultiplier"] = 1.35
            item["nhucThanBonus"] = 11
            item["ngoTinhBonus"] = 8
            item["powerBonus"] = 60
        elif idx < 120:
            item["rarity"] = "thanh"
            item["tuViMultiplier"] = 1.45
            item["nhucThanBonus"] = 8
            item["ngoTinhBonus"] = 15
            item["powerBonus"] = 85
        elif idx < 160:
            item["rarity"] = "vuong"
            item["tuViMultiplier"] = 1.35
            item["nhucThanBonus"] = 12
            item["ngoTinhBonus"] = 7
            item["powerBonus"] = 75
        else:
            item["rarity"] = "thanh"
            item["tuViMultiplier"] = 1.5
            item["nhucThanBonus"] = 10
            item["ngoTinhBonus"] = 14
            item["powerBonus"] = 95
    return items


def enrich_lucks_and_fates(entries: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    lucks = entries[:15]
    fates = entries[15:30]
    color_map = [
        ("Tím", "#c084fc", 78),
        ("Đen", "#9ca3af", 14),
        ("Đỏ Hồng", "#f87171", 56),
        ("Vàng", "#fbbf24", 66),
        ("Trắng", "#e2e8f0", 36),
        ("Xanh", "#38bdf8", 52),
        ("Xám", "#94a3b8", 28),
    ]
    for idx, lk in enumerate(lucks):
        color = "#e2e8f0"
        base = 42
        for kw, hex_col, bval in color_map:
            if kw.lower() in lk["name"].lower():
                color = hex_col
                base = bval
                break
        if "nghịch thiên" in lk["name"].lower():
            color = "#c084fc"
            base = 82
        elif "đan thần" in lk["name"].lower() or "thần binh" in lk["name"].lower():
            color = "#fbbf24"
            base = 70
        lk["id"] = f"luck_{idx + 1:02d}"
        lk["colorHex"] = color
        lk["khiVanBase"] = base
    for idx, ft in enumerate(fates):
        ft["id"] = f"fate_{idx + 1:02d}"
    return lucks, fates


def enrich_sects(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for idx, item in enumerate(items):
        if idx < 34:
            item["faction"] = "chinh_dao"
        elif idx < 67:
            item["faction"] = "ma_dao"
        else:
            item["faction"] = "trung_lap"
        item["powerReq"] = 100 if item["tier"] == "ha_gioi" else (25000 if item["tier"] == "tien_gioi" else 2500000)
    return items


def enrich_daos(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for idx, item in enumerate(items):
        g = item["group"].lower()
        if "thuận thiên" in g:
            item["alignment"] = "thuan_thien"
        elif "nghịch thiên" in g:
            item["alignment"] = "nghich_thien"
        else:
            item["alignment"] = "trung_lap"
        item["id"] = f"dao_{idx + 1:02d}"
    return items


def enrich_rankings() -> list[dict[str, Any]]:
    raw = (ROOT / "bãngehang.txt").read_text(encoding="utf-8")
    lines = [l.strip() for l in raw.splitlines() if l.strip()]
    rankings: list[dict[str, Any]] = []
    for line in lines[1:11]:
        if ":" in line:
            name, desc = line.split(":", 1)
            idx = len(rankings) + 1
            rankings.append(
                {
                    "id": f"rank_{idx:02d}",
                    "name": clean_text(name),
                    "description": clean_text(desc),
                    "tier": "ha_gioi" if idx <= 2 else ("tien_gioi" if idx <= 5 else "than_gioi"),
                    "minRealm": 2 if idx == 1 else (4 if idx == 2 else (11 if idx <= 5 else 20)),
                }
            )
    return rankings


# ---------------------------------------------------------------------------
# Events parser + deterministic classifier + curated milestones
# ---------------------------------------------------------------------------

CURATED_EVENTS: dict[int, dict[str, Any]] = {
    1: {
        "oneTime": True,
        "choices": [
            {
                "key": "A",
                "successRateBase": 0.92,
                "onSuccess": {
                    "narrative": "Tiếng khóc vang dội kinh động trời đất, tiên thiên khí huyết sung mãn!",
                    "statDelta": {"hp": 15, "maxHp": 15, "nhucThan": 6, "khiVan": 4},
                },
                "onFail": {
                    "narrative": "Khóc quá lớn khiến mẫu thân giật mình, hơi hụt khí nhẹ.",
                    "statDelta": {"nhucThan": 2},
                },
            },
            {
                "key": "B",
                "successRateBase": 0.95,
                "onSuccess": {
                    "narrative": "Đôi mắt thanh tỉnh quan sát bốn bề, ngộ tính bẩm sinh trỗi dậy.",
                    "statDelta": {"ngoTinh": 7, "tamCanh": 5},
                },
                "onFail": {
                    "narrative": "Ánh nhìn tĩnh lặng khiến phụ mẫu hơi lo âu nhưng bình an vô sự.",
                    "statDelta": {"tamCanh": 3},
                },
            },
            {
                "key": "C",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Nụ cười trẻ thơ làm dịu lòng gia tộc, thiện duyên bẩm sinh nở rộ.",
                    "statDelta": {"khiVan": 6, "congDuc": 4},
                },
                "onFail": {
                    "narrative": "Ngủ thiếp đi ngay sau đó nhưng khí sắc vẫn hồng hào.",
                    "statDelta": {"khiVan": 2},
                },
            },
        ],
    },
    2: {
        "oneTime": True,
        "choices": [
            {
                "key": "A",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Bàn tay nhỏ nắm chặt thanh kiếm gỗ: kiếm tâm manh nha từ thuở lọt lòng!",
                    "statDelta": {"nhucThan": 5, "ngoTinh": 3},
                    "rewardPool": "artifact",
                },
                "onFail": {
                    "narrative": "Kiếm gỗ nặng quá làm tuột tay, nhưng bạn vẫn thích thú.",
                    "statDelta": {"nhucThan": 2},
                },
            },
            {
                "key": "B",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Ôm quyển sách cũ không rời, đầu óc sớm nhạy bén với cổ tự.",
                    "statDelta": {"ngoTinh": 6, "tamCanh": 4},
                },
                "onFail": {
                    "narrative": "Xé rách một trang giấy, bị phụ thân bật cười dỗ dành.",
                    "statDelta": {"ngoTinh": 2},
                },
            },
            {
                "key": "C",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Chụp lấy thỏi vàng lẫn viên linh thạch lẻ, tài vận cuồn cuộn!",
                    "statDelta": {"linhThach": 40, "khiVan": 4},
                },
                "onFail": {
                    "narrative": "Vấp ngã khi với tay, may mắn không bị thương.",
                    "statDelta": {"linhThach": 15},
                },
            },
        ],
    },
    41: {
        "oneTime": True,
        "choices": [
            {
                "key": "A",
                "successRateBase": 0.92,
                "onSuccess": {
                    "narrative": "Đứng dưới mưa bão suốt một canh giờ, kinh mạch thức tỉnh cảm nhận linh khí!",
                    "statDelta": {"nhucThan": 8, "tuVi": 30, "tamCanh": 5},
                },
                "onFail": {
                    "narrative": "Cảm lạnh nặng sau cơn mưa nhưng ý chí thêm kiên cường.",
                    "statDelta": {"hp": -12, "tamCanh": 4},
                },
            },
            {
                "key": "B",
                "successRateBase": 0.95,
                "onSuccess": {
                    "narrative": "Ngồi yên quan sát mây trời, ngộ ra nhịp thở dẫn khí sơ khai.",
                    "statDelta": {"ngoTinh": 6, "tuVi": 25},
                },
                "onFail": {
                    "narrative": "Ngủ gật bên hiên nhà trong tiếng mưa rơi.",
                    "statDelta": {"hp": 5},
                },
            },
            {
                "key": "C",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Tích trữ lương khô giúp cả nhà vượt qua mùa bão lụt.",
                    "statDelta": {"linhThach": 25, "congDuc": 5},
                },
                "onFail": {
                    "narrative": "Bị ướt vài bao gạo nhưng vẫn giữ đủ dùng.",
                    "statDelta": {"linhThach": 10},
                },
            },
        ],
    },
    152: {
        "oneTime": True,
        "choices": [
            {
                "key": "A",
                "successRateBase": 0.88,
                "onSuccess": {
                    "narrative": "Vượt qua khảo hạch với thành tích xuất sắc, chính thức mở rộng tiền đồ tu tiên!",
                    "statDelta": {"tuVi": 80, "khiVan": 5, "congDuc": 6},
                    "daoShift": "thuan_thien",
                },
                "onFail": {
                    "narrative": "Thất thế ở vòng cuối, đành rẽ lối tự tìm cơ duyên khác.",
                    "statDelta": {"tamCanh": 5, "tuVi": 30},
                },
            },
            {
                "key": "B",
                "successRateBase": 0.9,
                "onSuccess": {
                    "narrative": "Không chịu khuất phục quy tắc cứng nhắc, giữ trọn bản tâm nghịch mệnh.",
                    "statDelta": {"ngoTinh": 7, "tuVi": 70, "nghiepLuc": 3},
                    "daoShift": "nghich_thien",
                },
                "onFail": {
                    "narrative": "Bị trưởng lão để ý, phải âm thầm rời khỏi quảng trường.",
                    "statDelta": {"tamCanh": 4},
                },
            },
            {
                "key": "C",
                "successRateBase": 0.95,
                "onSuccess": {
                    "narrative": "Giữ tâm thế tự do tự tại, kết duyên khắp thiên hạ.",
                    "statDelta": {"khiVan": 5, "linhThach": 60, "tuVi": 55},
                    "daoShift": "trung_lap",
                },
                "onFail": {
                    "narrative": "Bình thản bước tiếp con đường tu hành của riêng mình.",
                    "statDelta": {"tuVi": 30},
                },
            },
        ],
    },
    200: {
        "oneTime": True,
        "choices": [
            {
                "key": "A",
                "successRateBase": 0.95,
                "onSuccess": {
                    "narrative": "Năm 18 tuổi chính thức bái nhập đạo thống Thuận Thiên, nhận lễ vật nhập môn!",
                    "statDelta": {"tuVi": 110, "linhThach": 120, "congDuc": 10},
                    "daoShift": "thuan_thien",
                    "rewardPool": "technique",
                },
                "onFail": {
                    "narrative": "Vào tông môn với tư cách đệ tử thử việc, bắt đầu khổ tu.",
                    "statDelta": {"tuVi": 60, "linhThach": 50},
                    "daoShift": "thuan_thien",
                },
            },
            {
                "key": "B",
                "successRateBase": 0.92,
                "onSuccess": {
                    "narrative": "Khắc chữ Nghịch Thiên vào đạo tâm, bước vào tu chân giới bằng phong thái riêng!",
                    "statDelta": {"tuVi": 120, "nhucThan": 10, "nghiepLuc": 8},
                    "daoShift": "nghich_thien",
                    "rewardPool": "artifact",
                },
                "onFail": {
                    "narrative": "Dù gặp trắc trở lúc đầu, ý chí nghịch mệnh vẫn không hề lay chuyển.",
                    "statDelta": {"tuVi": 70, "tamCanh": 8},
                    "daoShift": "nghich_thien",
                },
            },
            {
                "key": "C",
                "successRateBase": 0.96,
                "onSuccess": {
                    "narrative": "Tự do tự tại làm Tán Tu / Ẩn Thế, mang theo bản đồ và linh thạch lên đường!",
                    "statDelta": {"tuVi": 95, "linhThach": 180, "khiVan": 8},
                    "daoShift": "trung_lap",
                    "rewardPool": "herb",
                },
                "onFail": {
                    "narrative": "Khởi hành nhẹ nhàng từ Tân Thủ Thôn bước vào giang hồ rộng lớn.",
                    "statDelta": {"tuVi": 65, "linhThach": 100},
                    "daoShift": "trung_lap",
                },
            },
        ],
    },
}


def classify_choice(
    choice_key: str,
    label: str,
    stage: int,
    event_id_num: int,
    allow_requirement: bool,
) -> tuple[dict[str, Any], bool]:
    low = label.lower()
    scale = {1: 1, 2: 3, 3: 18, 4: 150}[stage]

    # Determine if risky
    risky_words = [
        "cướp", "giết", "tàn sát", "trộm", "đánh", "liều", "khiêu chiến",
        "diệt", "phản", "nuốt", "xông", "hấp thụ", "đối đầu", "ám sát",
        "tước đoạt", "nổ", "cấm", "lôi kiếp",
    ]
    wise_words = [
        "đọc", "ngộ", "suy", "giải mã", "học", "nghiên cứu", "quan sát",
        "bói", "trận", "đan", "linh thảo", "thư viện", "quy luật", "thần văn",
    ]
    kind_words = [
        "cứu", "giúp", "tha", "trả", "chia sẻ", "bảo vệ", "hiến", "thiện",
        "tu sửa", "chữa", "bố thí", "từ chối",
    ]
    greed_words = ["linh thạch", "tiền", "bán", "mua", "đấu giá", "tài nguyên", "mỏ", "thương"]
    retreat_words = ["tránh", "chạy", "bỏ qua", "trốn", "án binh", "ẩn", "nhẫn", "khước từ"]

    is_risky = any(w in low for w in risky_words)
    is_wise = any(w in low for w in wise_words)
    is_kind = any(w in low for w in kind_words)
    is_greed = any(w in low for w in greed_words)
    is_safe = any(w in low for w in retreat_words)

    success_delta: dict[str, int] = {}
    fail_delta: dict[str, int] = {}
    reward_pool: str | None = None
    dao_shift: str | None = None
    requirement: dict[str, Any] | None = None

    if is_risky:
        rate = 0.64
        success_delta["tuVi"] = 22 * scale
        success_delta["nhucThan"] = 3 * stage
        success_delta["linhThach"] = 35 * scale
        fail_delta["hp"] = -14 * stage
        fail_delta["tuVi"] = 5 * scale
        if any(w in low for w in ("cướp", "giết", "tước", "ma", "huyết", "hắc")):
            success_delta["nghiepLuc"] = 6 * stage
            dao_shift = "nghich_thien"
        if allow_requirement and choice_key == "A" and event_id_num % 4 == 0:
            req_val = {1: 8, 2: 20, 3: 50, 4: 120}[stage]
            requirement = {
                "minStat": {"nhucThan": req_val},
                "label": f"Cần Nhục thân ≥ {req_val}",
            }
            rate = 0.72
        if "pháp bảo" in low or "kiếm" in low or "binh" in low:
            reward_pool = "artifact"
        elif "linh thú" in low or "yêu thú" in low:
            reward_pool = "beast"
    elif is_wise:
        rate = 0.84
        success_delta["ngoTinh"] = 3 * stage
        success_delta["tuVi"] = 18 * scale
        success_delta["tamCanh"] = 2 * stage
        fail_delta["ngoTinh"] = 1
        fail_delta["hp"] = -5 * stage
        if "đan" in low or "dược" in low:
            reward_pool = "elixir"
        elif "trận" in low:
            reward_pool = "array"
        elif "công pháp" in low or "sách" in low or "bí kíp" in low:
            reward_pool = "technique"
        elif "thần thông" in low or "quy luật" in low:
            reward_pool = "ability"
        if stage == 4:
            law_pick = ["lawThoiGian", "lawKhongGian", "lawNhanQua", "lawHonDon"][event_id_num % 4]
            success_delta[law_pick] = 8
            if "thần văn" in low or "cổ văn" in low or "truyền thừa" in low:
                success_delta["ancientProgress"] = 12
        if allow_requirement and choice_key == "B" and event_id_num % 5 == 0:
            req_val = {1: 10, 2: 22, 3: 55, 4: 130}[stage]
            requirement = {
                "minStat": {"ngoTinh": req_val},
                "label": f"Cần Ngộ tính ≥ {req_val}",
            }
    elif is_kind:
        rate = 0.90
        success_delta["congDuc"] = 5 * stage
        success_delta["khiVan"] = 3
        success_delta["tamCanh"] = 2 * stage
        success_delta["tuVi"] = 12 * scale
        fail_delta["congDuc"] = 2 * stage
        fail_delta["hp"] = -4 * stage
        dao_shift = "thuan_thien"
        if "đạo lữ" in low or "nữ tu" in low or "tiên tử" in low:
            reward_pool = "companion"
        elif "bằng hữu" in low or "sư huynh" in low or "lão" in low:
            reward_pool = "friend"
    elif is_greed:
        rate = 0.82
        success_delta["linhThach"] = 55 * scale
        success_delta["tuVi"] = 10 * scale
        fail_delta["linhThach"] = 15 * scale
        fail_delta["khiVan"] = -1
        if "linh thảo" in low or "cỏ" in low:
            reward_pool = "herb"
        elif "đan" in low:
            reward_pool = "elixir"
    elif is_safe:
        rate = 0.95
        success_delta["tamCanh"] = 2 * stage
        success_delta["hp"] = 8 * stage
        success_delta["tuVi"] = 8 * scale
        fail_delta["hp"] = 2 * stage
    else:
        rate = 0.86
        success_delta["tuVi"] = 16 * scale
        success_delta["nhucThan"] = 2 * stage
        success_delta["khiVan"] = 2
        fail_delta["tuVi"] = 6 * scale
        if "linh thú" in low:
            reward_pool = "beast"
        elif "bí cảnh" in low:
            reward_pool = "herb"

    option: dict[str, Any] = {
        "key": choice_key,
        "label": clean_text(label),
        "successRateBase": round(rate, 2),
        "onSuccess": {
            "narrative": f"Bạn chọn phương án {choice_key} và thực hiện thành công: {clean_text(label)}",
            "statDelta": success_delta,
        },
        "onFail": {
            "narrative": f"Phương án {choice_key} gặp trở ngại bất ngờ ngoài dự liệu, chỉ thu được chút kinh nghiệm.",
            "statDelta": fail_delta,
        },
    }
    if dao_shift:
        option["onSuccess"]["daoShift"] = dao_shift
    if reward_pool:
        option["onSuccess"]["rewardPool"] = reward_pool
    if requirement:
        option["requirement"] = requirement
    return option, requirement is not None


def detect_stage1_substage(id_num: int) -> str:
    if id_num <= 40:
        return "0-3"
    if id_num <= 100:
        return "4-10"
    if id_num <= 150:
        return "11-15"
    return "16-18"


def detect_substage(stage: int, id_num: int) -> str:
    if stage == 1:
        return detect_stage1_substage(id_num)
    if stage == 2:
        return "18-50" if id_num <= 230 else "51-100"
    if stage == 3:
        return "100-250" if id_num <= 330 else "251-500"
    return "500-5000" if id_num <= 425 else "5000+"


def parse_events_tsv(filename: str, stage: int) -> list[dict[str, Any]]:
    lines = [
        l.rstrip("\r\n")
        for l in (ROOT / filename).read_text(encoding="utf-8").splitlines()
        if l.strip()
    ]
    events: list[dict[str, Any]] = []
    for line in lines:
        if "\t" not in line:
            continue
        cols = line.split("\t")
        if len(cols) != 5 or not cols[0].strip().isdigit():
            continue
        id_num = int(cols[0].strip())
        prompt = clean_text(cols[1])
        opt_texts = [clean_text(cols[2]), clean_text(cols[3]), clean_text(cols[4])]

        has_locked = False
        choices: list[dict[str, Any]] = []
        for idx, key in enumerate(("A", "B", "C")):
            # Never lock Option C so player always has free fallback
            allow_req = (not has_locked) and (key in ("A", "B"))
            choice_obj, locked = classify_choice(key, opt_texts[idx], stage, id_num, allow_req)
            if locked:
                has_locked = True
            choices.append(choice_obj)

        one_time = id_num in {1, 2, 41, 100, 152, 200, 201, 260, 301, 360, 401, 450}
        if id_num in CURATED_EVENTS:
            cur = CURATED_EVENTS[id_num]
            one_time = cur.get("oneTime", one_time)
            for idx, cur_choice in enumerate(cur["choices"]):
                choices[idx]["successRateBase"] = cur_choice["successRateBase"]
                choices[idx]["onSuccess"] = cur_choice["onSuccess"]
                choices[idx]["onFail"] = cur_choice["onFail"]
                choices[idx].pop("requirement", None)

        events.append(
            {
                "id": f"ev_{id_num:03d}",
                "numId": id_num,
                "stage": stage,
                "subStage": detect_substage(stage, id_num),
                "title": prompt,
                "oneTime": one_time,
                "choices": choices,
            }
        )
    return events


def write_json(filename: str, payload: Any) -> pathlib.Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / filename
    with path.open("w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
    return path


def main() -> None:
    realms = build_realms()
    origins = enrich_origins(parse_multiline_colon("suatthan.txt", "origin", 100))
    physiques = enrich_physiques(parse_multiline_colon("thechat.txt", "physique", 200))

    khivan_entries = parse_singleline_entries(
        "khivan.txt",
        "kv",
        strip_prefixes=[
            "7. CÁC DẠNG KHÍ VẬN VÀ MỆNH CÁCH (30 Phân Loại)",
            "Được nhìn thấy thông qua Thần nhãn.",
        ],
        ignore_titles={"Chia theo màu sắc"},
    )
    lucks, fates = enrich_lucks_and_fates(khivan_entries)

    daos = enrich_daos(parse_multiline_colon("daogiao.txt", "dao"))
    sects = enrich_sects(parse_multiline_colon("thelucbandia.txt", "sect", 100))
    techniques = parse_multiline_colon("congphap.txt", "tech", 200)
    abilities = parse_singleline_entries(
        "thanthong.txt",
        "ability",
        strip_prefixes=[],
        ignore_titles={"Hệ Thống Phân Cấp Thần Thông"},
    )
    # Include Nhân Cấp Thần Thông if regex omitted header transition
    if not any("Nhân Cấp" in a["name"] for a in abilities):
        # Ensure we strip any helper rank descriptions from abilities so only actual abilities or clean set remain
        pass

    # Clean out the 3 non-ability tier explanations if present so abilities list stays crisp
    tier_explanations = {
        "Nhân Cấp Thần Thông",
        "Địa Cấp (Thiên Địa Thần Thông)",
        "Thiên Cấp (Đại Đạo Thần Thông)",
        "Chí Cao Thần Thông (Thần Minh Thần Thông)",
    }
    abilities = [a for a in abilities if a["name"] not in tier_explanations]
    for idx, ab in enumerate(abilities, start=1):
        ab["id"] = f"ability_{idx:03d}"

    artifacts = parse_multiline_colon("phapbao.txt", "artifact", 200)
    elixirs = parse_multiline_colon("danduoc.txt", "elixir", 200)
    herbs = parse_multiline_colon("linhthao.txt", "herb", 200)
    beasts = parse_multiline_colon("linhthu.txt", "beast", 200)
    arrays = parse_multiline_colon("tranphap.txt", "array", 200)
    companions = parse_multiline_colon("daolu.txt", "companion", 50)
    friends = parse_multiline_colon("banbe.txt", "friend", 100)
    secret_realms = parse_multiline_colon("bicanh.txt", "sr", 100)

    professions = parse_singleline_entries(
        "nghephu.txt",
        "prof",
        strip_prefixes=["1. HỆ THỐNG CHỨC NGHIỆP PHỤ (30 Nghề Nghiệp)"],
        ignore_titles={"Phân cấp chung cho mọi nghề"},
    )
    weather = parse_singleline_entries(
        "khihau.txt",
        "weather",
        strip_prefixes=["2. HỆ THỐNG KHÍ HẬU, THỜI TIẾT BIẾN DỊ & ĐỊA LÝ (30 Hiện Tượng)"],
    )
    tribulations = parse_singleline_entries("loikiep.txt", "trib")
    inner_demons = parse_multiline_colon("tammavaaocanh.txt", "demon", 30)
    rankings = enrich_rankings()
    calamities = parse_multiline_colon("dietthe.txt", "calamity")
    sect_relics = parse_multiline_colon("chibaochanphai.txt", "relic", 30)
    guilds = parse_multiline_colon("phuongthucvanhanh.txt", "guild", 30)
    vehicles = parse_multiline_colon("phuongtien.txt", "vehicle", 30)
    trade_rules = parse_multiline_colon("quyluatgiaodich.txt", "rule", 30)
    outer_enemies = parse_multiline_colon("thelucthudichcathegioi.txt", "enemy", 30)
    innate_talents = parse_multiline_colon("thienphucungloai.txt", "innate", 30)
    mutations = parse_multiline_colon("dinang.txt", "mutation", 30)
    ancient_texts = parse_multiline_colon("truyenthua.txt", "ancient", 30)
    regions = build_regions()
    sect_ranks = build_sect_ranks()

    ev1 = parse_events_tsv("0den18.txt", 1)
    ev2 = parse_events_tsv("18den100.txt", 2)
    ev3 = parse_events_tsv("100den500.txt", 3)
    ev4 = parse_events_tsv("500+.txt", 4)

    datasets: dict[str, Any] = {
        "realms.json": realms,
        "origins.json": origins,
        "physiques.json": physiques,
        "lucks.json": lucks,
        "fates.json": fates,
        "daos.json": daos,
        "sects.json": sects,
        "techniques.json": techniques,
        "abilities.json": abilities,
        "artifacts.json": artifacts,
        "elixirs.json": elixirs,
        "herbs.json": herbs,
        "beasts.json": beasts,
        "arrays.json": arrays,
        "companions.json": companions,
        "friends.json": friends,
        "secret_realms.json": secret_realms,
        "professions.json": professions,
        "weather.json": weather,
        "tribulations.json": tribulations,
        "inner_demons.json": inner_demons,
        "rankings.json": rankings,
        "calamities.json": calamities,
        "sect_relics.json": sect_relics,
        "guilds.json": guilds,
        "vehicles.json": vehicles,
        "trade_rules.json": trade_rules,
        "outer_enemies.json": outer_enemies,
        "innate_talents.json": innate_talents,
        "mutations.json": mutations,
        "ancient_texts.json": ancient_texts,
        "regions.json": regions,
        "sect_ranks.json": sect_ranks,
        "events_stage1.json": ev1,
        "events_stage2.json": ev2,
        "events_stage3.json": ev3,
        "events_stage4.json": ev4,
    }

    counts = {k.replace(".json", ""): len(v) for k, v in datasets.items()}
    total_events = len(ev1) + len(ev2) + len(ev3) + len(ev4)
    total_lore = sum(
        cnt
        for name, cnt in counts.items()
        if not name.startswith("events_") and name != "realms"
    ) + 30  # 30 cultivation realms

    datasets["codex_meta.json"] = {
        "counts": counts,
        "totalLoreEntries": total_lore,
        "totalEvents": total_events,
    }

    for fname, data in datasets.items():
        write_json(fname, data)

    print(
        f"Generated {len(datasets)} JSON files in {OUT_DIR} "
        f"(Lore={total_lore}, Events={total_events})"
    )


if __name__ == "__main__":
    main()
