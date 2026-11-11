import json
import pathlib
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
GENERATED_DIR = ROOT / "web_game" / "src" / "data" / "generated"
SCRIPT_PATH = ROOT / "scripts" / "build_data.py"


class BuildDataPipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        if not SCRIPT_PATH.exists():
            return
        res = subprocess.run(
            [sys.executable, str(SCRIPT_PATH)],
            cwd=str(ROOT),
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
        cls.run_result = res

    def _load_json(self, filename: str):
        path = GENERATED_DIR / filename
        self.assertTrue(path.exists(), f"Missing generated file: {path}")
        with path.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    def test_script_exists_and_succeeds(self) -> None:
        self.assertTrue(SCRIPT_PATH.exists(), "scripts/build_data.py must exist")
        self.assertEqual(
            self.run_result.returncode,
            0,
            f"build_data.py failed: {self.run_result.stderr}",
        )

    def test_lore_collection_counts(self) -> None:
        realms = self._load_json("realms.json")
        self.assertEqual(len([r for r in realms if r["index"] >= 1]), 30)
        self.assertEqual(len(realms), 31)

        expected_exact = {
            "origins.json": 100,
            "physiques.json": 200,
            "lucks.json": 15,
            "fates.json": 15,
            "techniques.json": 200,
            "elixirs.json": 200,
            "artifacts.json": 200,
            "herbs.json": 200,
            "beasts.json": 200,
            "arrays.json": 200,
            "companions.json": 50,
            "friends.json": 100,
            "secret_realms.json": 100,
            "sects.json": 100,
            "professions.json": 30,
            "weather.json": 30,
            "inner_demons.json": 30,
            "sect_relics.json": 30,
            "guilds.json": 30,
            "vehicles.json": 30,
            "trade_rules.json": 30,
            "outer_enemies.json": 30,
            "innate_talents.json": 30,
            "mutations.json": 30,
            "ancient_texts.json": 30,
            "abilities.json": 100,
            "tribulations.json": 20,
        }
        for fname, count in expected_exact.items():
            data = self._load_json(fname)
            self.assertEqual(len(data), count, f"{fname} expected {count}, got {len(data)}")

        expected_min = {
            "daos.json": 29,
            "rankings.json": 10,
            "calamities.json": 20,
            "regions.json": 15,
        }
        for fname, min_count in expected_min.items():
            data = self._load_json(fname)
            self.assertGreaterEqual(
                len(data), min_count, f"{fname} expected >= {min_count}, got {len(data)}"
            )

    def test_events_all_four_stages_valid(self) -> None:
        stage_files = [
            ("events_stage1.json", 200, 1),
            ("events_stage2.json", 60, 2),
            ("events_stage3.json", 60, 3),
            ("events_stage4.json", 50, 4),
        ]
        seen_ids = set()
        for fname, exact_count, stage in stage_files:
            events = self._load_json(fname)
            self.assertEqual(len(events), exact_count, f"{fname} count mismatch")
            for ev in events:
                self.assertEqual(ev["stage"], stage)
                self.assertNotIn(ev["id"], seen_ids, f"Duplicate event id: {ev['id']}")
                seen_ids.add(ev["id"])
                self.assertTrue(ev["title"], f"Empty title in {ev['id']}")
                self.assertEqual(len(ev["choices"]), 3, f"{ev['id']} must have 3 choices")

                locked_count = 0
                for opt in ev["choices"]:
                    self.assertIn(opt["key"], ("A", "B", "C"))
                    self.assertTrue(opt["label"])
                    self.assertGreaterEqual(opt["successRateBase"], 0.15)
                    self.assertLessEqual(opt["successRateBase"], 0.99)
                    self.assertIsInstance(opt["onSuccess"]["statDelta"], dict)
                    self.assertIsInstance(opt["onFail"]["statDelta"], dict)
                    if opt.get("requirement"):
                        locked_count += 1
                self.assertLessEqual(
                    locked_count,
                    1,
                    f"Event {ev['id']} must leave at least 2 choices unlocked",
                )

    def test_codex_meta_consistent(self) -> None:
        meta = self._load_json("codex_meta.json")
        self.assertGreaterEqual(meta["totalLoreEntries"], 1900)
        self.assertGreaterEqual(meta["totalEvents"], 370)


if __name__ == "__main__":
    unittest.main()
