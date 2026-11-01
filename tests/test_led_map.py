import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "service"))
from led_map import command_for_slot


class LedMapTests(unittest.TestCase):
    def test_auto_assigns_one_distinct_player_led_per_receiver_slot(self):
        self.assertEqual([command_for_slot("auto", slot) for slot in range(1, 5)],
                         [6, 7, 8, 9])

    def test_leds_off_applies_consistently_to_every_slot(self):
        self.assertEqual([command_for_slot("0", slot) for slot in range(1, 5)],
                         [0] * 4)

    def test_invalid_modes_and_slots_are_rejected(self):
        for mode, slot in (("auto", 0), ("auto", 5), ("6", 1), ("0;reboot", 1)):
            with self.assertRaises(ValueError):
                command_for_slot(mode, slot)


if __name__ == "__main__":
    unittest.main()
