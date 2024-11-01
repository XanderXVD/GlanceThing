import React, { useState } from "react";

// Import de individuele stap-componenten
// import FlashDevice from "./Steps/FlashDevice/FlashDevice.js";
// import InstallApp from "./Steps/InstallApp/InstallApp.js";
import Connect from "./Steps/Connect/Connect.js";
import Welcome from "./Steps/Welcome/Welcome.js";
import Done from "./Steps/Done/Done.js";

import styles from "./Setup.module.css";
import Spotify from "./Steps/Spotify/Spotify.js";

// Enum om de verschillende setup-stappen te definiëren
enum Steps {
  Welcome,
  // FlashDevice,
  // InstallApp,
  Spotify,
  Connect,
  Complete,
}

const Setup: React.FC = () => {
  // Houdt de huidige stap van de setup flow bij
  const [step, setStep] = useState<Steps>(0);

  return (
    <div className={styles.setup}>
      {/* Conditionally render each setup step based on the current step value */}
      {step === Steps.Welcome ? (
        // Render de Welcome stap en ga verder naar FlashDevice als voltooid
        <Welcome
          onStepComplete={() => setStep(Steps.Spotify)}
        /> /*: step === Steps.FlashDevice ? (
        // Render de FlashDevice stap en ga verder naar InstallApp als voltooid
        <FlashDevice onStepComplete={() => setStep(Steps.InstallApp)} />
      ) : step === Steps.InstallApp ? (
        // Render de InstallApp stap en ga verder naar Spotify als voltooid
        <InstallApp onStepComplete={() => setStep(Steps.Spotify)} />
      ) */
      ) : step === Steps.Spotify ? (
        // Render de Spotify stap en ga verder naar Connect als voltooid
        <Spotify onStepComplete={() => setStep(Steps.Connect)} />
      ) : step === Steps.Connect ? (
        // Render de Connect stap en ga verder naar Complete als voltooid
        <Connect onStepComplete={() => setStep(Steps.Complete)} />
      ) : step === Steps.Complete ? (
        // Render de laatste stap, Done, om het setup proces af te ronden
        <Done />
      ) : null}
      {/* Toon niets als de stap onbekend is */}
    </div>
  );
};

export default Setup;
