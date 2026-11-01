def command_for_slot(mode, slot):
    if mode == "auto" and 1 <= slot <= 4:
        return 5 + slot
    if mode == "0" and 1 <= slot <= 4:
        return 0
    raise ValueError("Unsupported LED mode or receiver slot")
