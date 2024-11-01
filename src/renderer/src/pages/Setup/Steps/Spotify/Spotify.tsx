import React, { useEffect, useRef, useState } from "react";

import Loader from "@/components/Loader/Loader.js";

import styles from "./Spotify.module.css";

// Interface voor de props die de Spotify-component ontvangt
interface SpotifyProps {
  onStepComplete: () => void; // Callback functie om door te gaan naar de volgende stap
}

// Enum die de verschillende toestanden van het Spotify-token validatieproces aangeeft
enum State {
  Pending, // Startstatus of wachtend op actie
  Checking, // Het token wordt momenteel gecontroleerd
  Valid, // Het token is geldig
  Invalid, // Het token is ongeldig
}

const Spotify: React.FC<SpotifyProps> = ({ onStepComplete }) => {
  // Huidige toestand van het validatieproces
  const [state, setState] = useState<State>(0);

  const inputRef = useRef<HTMLInputElement | null>(null); // Referentie naar de token-invoer

  // Functie die het Spotify-token controleert door een API-oproep uit te voeren
  async function check() {
    const token = inputRef.current!.value; // Haalt de waarde van het invoerveld op
    setState(State.Checking); // Zet de toestand op "Checking"
    const valid = await window.api.setSpotifyToken(token); // Controleert het token via de API
    if (valid)
      setState(State.Valid); // Zet op "Valid" als het token geldig is
    else setState(State.Invalid); // Zet op "Invalid" als het token ongeldig is
  }

  // useEffect die de huidige token-status controleert bij het laden van de component
  useEffect(() => {
    window.api.getStorageValue("sp_dc").then((t) => {
      if (t) setState(State.Valid); // Zet de toestand op "Valid" als een geldig token is gevonden
    });
  }, []); // Lege dependency array zorgt ervoor dat dit maar één keer wordt uitgevoerd

  return (
    <div className={styles.spotify}>
      <p className={styles.step}>Step 1</p>
      <h1>Getting Spotify Token</h1>
      <p>
        Now you&apos;ll get your Spotify token, so GlanceThing can show you your
        playback status live.
      </p>
      {/* Link naar handleiding voor het verkrijgen van het Spotify-token */}
      <a
        href="https://github.com/BluDood/GlanceThing/wiki/Getting-your-Spotify-token"
        target="_blank"
        rel="noreferrer"
      >
        Follow this guide on how to get it.
      </a>
      {/* Invoerveld voor het Spotify-token */}
      <input
        ref={inputRef}
        disabled={[State.Checking, State.Valid].includes(state)}
        type="password"
        placeholder="sp_dc token"
      />
      {/* Weergave van status op basis van de toestand */}
      {state === State.Checking ? (
        // Laadindicator en bericht tijdens controle
        <div className={styles.state} key={"checking"}>
          <Loader />
          <p>Checking...</p>
        </div>
      ) : state === State.Valid ? (
        // Bericht en pictogram bij geldigheid van het token
        <div className={styles.state} key={"valid"}>
          <span className="material-icons">check_circle</span>
          <p>Valid!</p>
        </div>
      ) : state === State.Invalid ? (
        // Foutbericht en pictogram bij ongeldig token
        <div className={styles.state} key={"invalid"}>
          <span className="material-icons" data-type="error">
            error
          </span>
          <p>Invalid token!</p>
        </div>
      ) : null}

      {/* Dynamische knoppen op basis van de status */}
      <div className={styles.buttons}>
        {[State.Pending, State.Invalid].includes(state) ? (
          // Knop voor controle bij "Pending" of "Invalid" toestand
          <button onClick={check}>Check</button>
        ) : state === State.Valid ? (
          // Knop om door te gaan bij een geldig token
          <button onClick={onStepComplete}>Continue</button>
        ) : null}
      </div>
    </div>
  );
};

export default Spotify;
