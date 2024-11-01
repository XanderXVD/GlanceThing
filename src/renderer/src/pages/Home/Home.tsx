import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import icon from "@/assets/icon.png";

import styles from "./Home.module.css";

// Enum to represent different states of the CarThing device
enum CarThingState {
  NotFound = "not_found",
  NotInstalled = "not_installed",
  Installing = "installing",
  Ready = "ready",
}

const Home: React.FC = () => {
  const navigate = useNavigate();
  // carThingState is used to track the current state of CarThing
  const [carThingState, setCarThingState] = useState<CarThingState | null>(
    null
  );
  const carThingStateRef = useRef(carThingState); // Reference to the carThingState to access latest state in async functions

  useEffect(() => {
    // Check if setup has been completed by retrieving 'setupComplete' value from storage
    window.api.getStorageValue("setupComplete").then((setupComplete) => {
      // Redirect to /setup if setup has not been completed
      if (!setupComplete) navigate("/setup");
    });

    // Set up an event listener for 'carThingState' updates from the main process or API
    const removeListener = window.api.on("carThingState", async (s) => {
      const state = s as CarThingState; // Cast to CarThingState enum
      setCarThingState(state); // Update the state
      carThingStateRef.current = state; // Update the ref to reflect the latest state
    });

    // Timeout to ensure a CarThing state update is triggered if no state is received within 200ms
    const timeout = setTimeout(() => {
      if (carThingStateRef.current !== null) return; // If state is already set, skip

      window.api.triggerCarThingStateUpdate(); // Request a CarThing state update
    }, 200);

    // Cleanup: remove the event listener and clear the timeout when component unmounts
    return () => {
      removeListener();
      clearTimeout(timeout);
    };
  }, []); // Empty dependency array ensures this runs only once after the component mounts

  return (
    <div className={styles.home}>
      <img src={icon} alt="" /> {/* Display app logo */}
      <h1>GlanceThing</h1>
      <div className={styles.status}>
        {carThingState === CarThingState.NotFound ? (
          <>
            {/* Display message if CarThing is not found */}
            <p>
              CarThing not found. Please reconnect it to your computer, or run
              setup again.
            </p>
            <button onClick={() => navigate("/setup")}>
              Setup <span className="material-icons">arrow_forward</span>
            </button>
          </>
        ) : carThingState === CarThingState.NotInstalled ? (
          <>
            {/* Display message if CarThing is found but app is not installed */}
            <p>CarThing found, but the app is not installed.</p>
            <button onClick={() => navigate("/setup")}>
              Setup <span className="material-icons">arrow_forward</span>
            </button>
          </>
        ) : carThingState === CarThingState.Installing ? (
          // Display message while app is installing on CarThing
          <p>CarThing found, but the app is not installed. Installing...</p>
        ) : carThingState === CarThingState.Ready ? (
          // Display message when CarThing is ready for use
          <p>CarThing is ready!</p>
        ) : (
          // Default message while checking for CarThing state
          <p>Checking for CarThing...</p>
        )}
      </div>
    </div>
  );
};

export default Home;
