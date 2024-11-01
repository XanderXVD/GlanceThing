import React, { useEffect, useState } from "react";

import Loader from "@/components/Loader/Loader.js";

import styles from "./Connect.module.css";

// Interface voor de props die de Connect-component ontvangt
interface ConnectProps {
  onStepComplete: () => void; // Callback functie om door te gaan naar de volgende stap
}

// Enum die de verschillende toestanden van het serverproces aangeeft
enum State {
  Pending, // Server is nog niet gestart
  Starting, // Server wordt momenteel gestart
  Started, // Server is succesvol gestart
}

const Connect: React.FC<ConnectProps> = ({ onStepComplete }) => {
  // Huidige toestand van het serverproces
  const [state, setState] = useState<State>(0);

  // Functie die het startproces van de server beheert
  async function install() {
    setState(State.Starting); // Zet toestand op "Starting"
    await window.api.startServer(); // Start de server via API-oproep
    setState(State.Started); // Zet toestand op "Started" zodra server is gestart
  }

  // useEffect die bij het laden controleert of de server al gestart is
  useEffect(() => {
    window.api.isServerStarted().then((started) => {
      if (started) setState(State.Started); // Zet toestand op "Started" als de server al draait
    });
  }, []); // Lege dependency array zorgt ervoor dat dit maar één keer wordt uitgevoerd

  return (
    <div className={styles.connect}>
      <p className={styles.step}>Step 2</p>
      <h1>Start the server</h1>
      <p>
        You should now see a welcome screen on the CarThing. Start the internal
        server and start enjoying your GlanceThing!
      </p>

      {/* Weergave van de huidige status */}
      {state === State.Starting ? (
        // Laadindicator en bericht tijdens het starten
        <div className={styles.state} key={"installing"}>
          <Loader />
          <p>Starting...</p>
        </div>
      ) : state === State.Started ? (
        +(
          (
            // Bevestiging en pictogram wanneer de server is gestart
            <div className={styles.state} key={"complete"}>
              <span className="material-icons">check_circle</span>
              <p>Started!</p>
            </div>
          )
        )
      ) : null}

      {/* Dynamische knoppen afhankelijk van de toestand */}
      <div className={styles.buttons}>
        {state === State.Pending ? (
          // "Start" knop als de server nog niet gestart is
          <button onClick={install}>Start</button>
        ) : state === State.Started ? (
          // "Continue" knop wanneer de server is gestart
          <button onClick={onStepComplete}>Continue</button>
        ) : null}
      </div>
    </div>
  );
};

export default Connect;
