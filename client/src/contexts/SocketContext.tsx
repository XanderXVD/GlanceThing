import React, { createContext, useEffect, useRef, useState } from "react";

import { getSocketPassword } from "@/lib/utils.ts"; // Importeert een helperfunctie om het socket-wachtwoord op te halen

// Definieert het type voor de socket-context waarden
interface SocketContextProps {
  ready: boolean;
  firstLoad: boolean;
  socket: WebSocket | null;
}

// Maakt een context aan met standaardwaarden
const SocketContext = createContext<SocketContextProps>({
  ready: false,
  firstLoad: true,
  socket: null,
});

// Type voor de eigenschappen van de contextprovider
interface SocketContextProviderProps {
  children: React.ReactNode;
}

// De provider-component die de socket-context levert aan de componenten binnen deze context
const SocketContextProvider = ({ children }: SocketContextProviderProps) => {
  const [ready, setReady] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);

  // Functie om verbinding te maken met de WebSocket-server
  function connect() {
    ws.current = new WebSocket("ws://localhost:1337"); // Start een nieuwe WebSocket-verbinding

    // Wordt uitgevoerd wanneer de WebSocket-verbinding succesvol geopend is
    ws.current.onopen = async () => {
      const pass = await getSocketPassword(); // Haalt het wachtwoord op voor de socket-verbinding
      if (pass)
        ws.current?.send(
          JSON.stringify({
            type: "auth", // Verstuur een authenticatiebericht met het wachtwoord
            data: pass,
          })
        );
      setReady(true); // Stel de status in dat de verbinding gereed is
      setTimeout(() => {
        setFirstLoad(false); // Na een vertraging markeert dit het einde van de eerste laadfase
      }, 500);
    };

    // Wordt uitgevoerd wanneer de WebSocket-verbinding sluit
    ws.current.onclose = () => {
      setReady(false);
      setTimeout(() => {
        connect(); // Probeer opnieuw verbinding te maken na een korte vertraging
      }, 1000);
    };
  }

  // useEffect wordt uitgevoerd bij de eerste render en zorgt voor het openen en sluiten van de WebSocket-verbinding
  useEffect(() => {
    connect(); // Start de verbinding

    return () => {
      ws.current?.close(); // Sluit de WebSocket-verbinding wanneer de component wordt ontkoppeld
    };
    // eslint-disable-next-line
  }, []);

  return (
    <SocketContext.Provider
      value={{
        ready,
        firstLoad,
        socket: ws.current,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { SocketContext, SocketContextProvider };
