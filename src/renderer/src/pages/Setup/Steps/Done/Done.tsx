import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import party from "party-js";

import styles from "./Done.module.css";

import icon from "@/assets/icon.png";

// Dit component geeft het eindscherm weer wanneer de setup voltooid is
const Done: React.FC = () => {
  const navigate = useNavigate(); // Hook voor navigatie naar de startpagina

  // useEffect met initialisatie van confetti-effect zodra component geladen is
  useEffect(() => {
    celebrate();
  }, []);

  // Functie voor het afspelen van het confetti-effect
  function celebrate() {
    party.confetti(document.body, {
      count: 30, // Aantal confetti-deeltjes
      spread: 40, // Verspreiding van confetti
      size: 1, // Grootte van de confetti
    });
  }

  // Functie die de setup als voltooid markeert en terug navigeert naar de startpagina
  async function complete() {
    await window.api.setStorageValue("setupComplete", true); // Sla "setupComplete" op als true in de storage
    navigate("/"); // Navigeer naar de hoofdpagina
  }

  return (
    <div className={styles.done}>
      {/* Icon met klikbare functie om confetti nogmaals af te spelen */}
      <img src={icon} alt="" onClick={() => celebrate()} />
      <h1>Setup Complete!</h1>
      <p>Congratulations! Your GlanceThing is ready to use. Enjoy!</p>

      {/* Knop om het voltooien van de setup te bevestigen */}
      <div className={styles.buttons}>
        <button onClick={complete}>Complete</button>
      </div>
    </div>
  );
};

export default Done;
