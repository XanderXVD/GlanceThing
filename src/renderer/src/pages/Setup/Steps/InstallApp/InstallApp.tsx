import React, { useEffect, useState } from "react";

import Loader from "@/components/Loader/Loader.js";

import styles from "./InstallApp.module.css";

// Interface voor de props die de InstallApp-component ontvangt
interface InstallAppProps {
  onStepComplete: () => void; // Callback functie om door te gaan naar de volgende stap
}

// Enum die de verschillende toestanden van de installatieprocedure aangeeft
enum State {
  Pending,
  Installing,
  Complete,
  Error,
}

// Mogelijke foutmeldingen tijdens de installatieprocedure
const errors = {
  adb_download_failed:
    "Failed to download ADB. Make sure you have an active internet connection.",
  adb_extract_failed: "Failed to extract ADB.",
  webapp_download_failed:
    "Failed to download the GlanceThing client. Make sure you have an active internet connection.",
  webapp_extract_failed: "Failed to extract the GlanceThing client.",
};

const InstallApp: React.FC<InstallAppProps> = ({ onStepComplete }) => {
  // Huidige toestand van de installatieprocedure
  const [state, setState] = useState<State>(0);
  const [error, setError] = useState<string | null>(null);

  async function install() {
    // Asynchrone functie om de installatie van de app te starten
    setState(State.Installing); // Zet de toestand op "Installing" bij de start van de installatie
    const res = await window.api.installApp(); // Roept de API aan om de installatie uit te voeren
    if (res !== true) {
      // Controleert op fouten
      setError(errors[res] || "An unexpected error has occurred!");
      setState(State.Error);
      return;
    }
    setState(State.Complete); // Zet de toestand op "Complete" als de installatie geslaagd is
  }

  // useEffect controleert of de setup al is voltooid bij het laden van de component
  useEffect(() => {
    window.api.findSetupCarThing().then((state) => {
      if (state === "ready") setState(State.Complete); // Zet de toestand op "Complete" als het apparaat klaar is
    });
  }, []); // Lege dependency array zorgt ervoor dat dit maar één keer wordt uitgevoerd bij laden van component

  return (
    <div className={styles.flash}>
      <p className={styles.step}>Step 2</p>
      <h1>Install GlanceThing</h1>
      <p>
        Now that you have shell access to the Car Thing, you can install
        GlanceThing.
      </p>
      <p>
        This will not overwrite the original Spotify software, it will only
        temporarily mount it.
      </p>
      {/* Toont de status van de installatieprocedure op basis van de huidige toestand */}
      {state === State.Installing ? (
        // Laadindicator en bericht tijdens de installatie
        <div className={styles.state} key={"installing"}>
          <Loader />
          <p>Installing...</p>
        </div>
      ) : state === State.Complete ? (
        // Bericht en pictogram wanneer de installatie voltooid is
        <div className={styles.state} key={"complete"}>
          <span className="material-icons">check_circle</span>
          <p>Installed!</p>
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

      {/* Dynamische knoppen voor het starten van de installatie of doorgaan naar de volgende stap */}
      <div className={styles.buttons}>
        {[State.Pending, State.Error].includes(state) ? (
          // Knop om de installatie te starten, verschijnt bij "Pending" of "Error" toestanden
          <button onClick={install}>Install</button>
        ) : state === State.Complete ? (
          // Knop om door te gaan naar de volgende stap als de installatie voltooid is
          <button onClick={onStepComplete}>Continue</button>
        ) : null}
      </div>
    </div>
  );
};

export default InstallApp;
