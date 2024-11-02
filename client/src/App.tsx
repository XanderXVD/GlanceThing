import { useContext, useEffect } from "react";

// Importeer contexten voor toegang tot de app-blur status en socket-verbinding status
import { AppBlurContext } from "@/contexts/AppBlurContext.tsx";
import { SocketContext } from "@/contexts/SocketContext.tsx";

// Componenten die worden weergegeven binnen de app
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen.tsx";
import Statusbar from "@/components/Statusbar/Statusbar.tsx";
import Widgets from "@/components/Widgets/Widgets.tsx";
import Menu from "@/components/Menu/Menu.tsx";

// Importeer de CSS-module voor stijltoepassing
import styles from "./App.module.css";

const App: React.FC = () => {
  // Haal de blur-status op vanuit de AppBlurContext
  const { blurred } = useContext(AppBlurContext);
  // Haal de socket-verbinding status op vanuit de SocketContext
  const { ready } = useContext(SocketContext);

  // useEffect om een "Escape"-key event listener toe te voegen
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      // Controleer of de Escape-toets is ingedrukt
      if (e.key === "Escape") {
        const focused = document.activeElement as HTMLElement;
        // Verwijder focus van het huidige element als er een gefocust element is
        if (focused) focused.blur();
      }
    };

    // Voeg een event listener toe voor toetsindrukken
    document.addEventListener("keydown", listener);

    // Verwijder de event listener bij demontage van de component om geheugenlekken te voorkomen
    return () => {
      document.removeEventListener("keydown", listener);
    };
  });

  return (
    <>
      <div className={styles.app} data-blurred={blurred || !ready}>
        <Statusbar />
        <Widgets />
      </div>
      <LoadingScreen />
      <Menu />
    </>
  );
};

export default App;
