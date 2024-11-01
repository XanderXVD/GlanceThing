import React from 'react'

import styles from './Welcome.module.css'

import icon from '@/assets/icon.png'

// Interface voor de props die de Welcome-component ontvangt
interface WelcomeProps {
  onStepComplete: () => void // Functie om door te gaan naar de volgende stap
}

// Welcome-component voor het introduceren van de gebruiker aan GlanceThing
const Welcome: React.FC<WelcomeProps> = ({ onStepComplete }) => {
  return (
    <div className={styles.welcome}>
      {/* Toon het app-pictogram */}
      <img src={icon} alt="" />
      <h1>Welcome to GlanceThing!</h1>
      <p>
        With only a few steps, you&apos;ll be up and running with
        GlanceThing.
      </p>
      <div className={styles.buttons}>
        {/* Knop om het setup proces te starten en door te gaan naar de volgende stap */}
        <button onClick={onStepComplete}>Get Started</button>
      </div>
    </div>
  )
}

export default Welcome
