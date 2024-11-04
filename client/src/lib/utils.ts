import axios from 'axios'

// Deze functie zoekt de afbeelding in 'covers' die het dichtst bij de opgegeven breedte (width) komt.
export function getClosestImage(
  covers: { url: string; width: number; height: number }[], // Array van afbeeldingsobjecten met URL, breedte en hoogte
  width: number // De gewenste breedte van de afbeelding
) {
  // Filtert afbeeldingen die breder zijn dan of gelijk zijn aan de gewenste breedte
  const valid = covers.filter(cover => cover.width >= width)

  // Als er geen afbeeldingen zijn die aan de breedte voldoen, retourneert het de eerste afbeelding in de lijst
  if (valid.length === 0) return covers[0]

  // Sorteert de gefilterde afbeeldingen op breedte in oplopende volgorde, zodat de dichtstbijzijnde afbeelding eerst komt
  valid.sort((a, b) => a.width - b.width)

  // Retourneert de afbeelding met de kleinste breedte die aan de voorwaarde voldoet
  return valid[0]
}

// Deze asynchrone functie haalt het wachtwoord voor de socket op door een GET-verzoek te sturen naar './ws-password'.
export async function getSocketPassword() {
  // Voert een GET-verzoek uit naar de opgegeven URL om het wachtwoord op te halen
  const res = await axios.get('./ws-password')

  // Vervangt eventuele nieuwe-regel tekens ('\n') en retourneert de aangepaste string
  return res.data.replace('\n', '')
}
