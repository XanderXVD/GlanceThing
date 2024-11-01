import React, { useEffect, useState } from "react";

import Loader from "@/components/Loader/Loader.js";

import styles from "./FlashDevice.module.css";

// Interface voor de props die FlashDevice ontvangt
interface FlashDeviceProps {
  onStepComplete: () => void;
}

// Enum voor de verschillende toestanden van het apparaat tijdens de flash-procedure
enum State {
  Pending,
  Finding,
  Found,
  NotFound,
  Error,
}

// Foutmeldingen die kunnen optreden tijdens het flash-proces
const errors = {
  adb_download_failed:
    "Failed to download ADB. Make sure you have an active internet connection.",
  adb_extract_failed: "Failed to extract ADB.",
};

const FlashDevice: React.FC<FlashDeviceProps> = ({ onStepComplete }) => {
  // Houdt de huidige toestand van het apparaat bij tijdens de flash-procedure
  const [state, setState] = useState<State>(0);
  const [error, setError] = useState<string | null>(null);

  // Asynchrone functie om te controleren of het apparaat (CarThing) wordt gevonden
  async function findCarThing() {
    setState(State.Finding); // Zet de staat naar "Finding" bij start van het zoeken
    const found = await window.api.findCarThing(); // Roept API aan om CarThing te zoeken
    if (typeof found !== "boolean") {
      // Controleer op fouten die geen booleans zijn
      setError(errors[found] || "An unexpected error has occurred!");
      setState(State.Error);
      return;
    }
    // Zet de staat op "Found" of "NotFound" afhankelijk van het resultaa
    setState(found ? State.Found : State.NotFound);
  }

  // useEffect om het apparaat direct te zoeken bij het laden van de component
  useEffect(() => {
    window.api.findCarThing().then((found) => {
      if (found === true) setState(State.Found); // Update staat naar "Found" indien gevonden
    });
  }, []); // Lege dependency array zorgt ervoor dat dit maar één keer loopt

  return (
    <div className={styles.flash}>
      <p className={styles.step}>Step 1</p>
      <h1>Flash your device</h1>
      <p>First, you have to flash your device with a custom firmware.</p>
      <a
        href="https://github.com/BluDood/GlanceThing/wiki/Flashing-the-CarThing"
        target="_blank"
        rel="noreferrer"
      >
        Follow the guide here.
      </a>
      <p>Once you have completed the flash, press &quot;Find Car Thing&quot;</p>
      {/* Statusbericht afhankelijk van de huidige staat */}
      {state === State.Finding ? (
        // Laadindicator en bericht tijdens het zoeken naar het apparaat
        <div className={styles.state} key={"finding"}>
          <Loader />
          <p>Finding CarThing...</p>
        </div>
      ) : state === State.Found ? (
        // Bericht en pictogram wanneer het apparaat gevonden is
        <div className={styles.state} key={"found"}>
          <span className="material-icons">check_circle</span>
          <p>Found CarThing!</p>
        </div>
      ) : state === State.NotFound ? (
        // Foutmelding wanneer het apparaat niet gevonden kan worden
        <div className={styles.state} key={"notfound"}>
          <span className="material-icons" data-type="error">
            error
          </span>
          <p>Could not find CarThing!</p>
        </div>
      ) : state === State.Error ? (
        // Bericht bij een onverwachte fout
        <div className={styles.state} key={"error"}>
          <span className="material-icons" data-type={"error"}>
            error
          </span>
          <p>{error}</p>
        </div>
      ) : null}

      {/* Knoppen voor zoeken naar het apparaat of doorgaan naar de volgende stap */}
      <div className={styles.buttons}>
        {[State.Pending, State.NotFound, State.Error].includes(state) ? (
          // Knop om opnieuw naar het apparaat te zoeken indien niet gevonden of er een fout was
          <button onClick={findCarThing}>Find Car Thing</button>
        ) : state === State.Found ? (
          // Knop om door te gaan naar de volgende stap indien het apparaat gevonden is
          <button onClick={onStepComplete}>Continue</button>
        ) : null}
      </div>
    </div>
  );
};

export default FlashDevice;
