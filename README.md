# Rodzina w drodze

Samodzielny prototyp pikselowej gry inspirowany szkicem `images/car-game-design.jpg`.

Otwórz `index.html` w przeglądarce. Gra nie wymaga instalowania zależności ani kompilacji.

- **1 / 2 / 3** lub karty po prawej: mama, tata, córka.
- **E**: wstań, usiądź przy swoim stanowisku, przejmij kierownicę przy kabinie lub wróć do wnętrza.
- **WASD / strzałki**: chodzenie we wnętrzu; w widoku miasta W/S sterują gazem i hamulcem, A/D skręcają.
- **Spacja**: hamulec podczas jazdy.
- **P**: pauza.

Kierowca automatycznie jedzie ulicą, gdy rodzina jest we wnętrzu. Mama i tata mają komputery, córka laptop. Po przejęciu kierownicy kamera odsuwa się, a dach zasłania wnętrze. Budynki zatrzymują samochód. Wnętrze ma kolizje ze stanowiskami i wyposażeniem.

Grafika jest rysowana w Canvas, bez zewnętrznych zasobów graficznych. Opcjonalne fonty Google mają lokalne fonty zapasowe. Prototyp jest przeznaczony do klawiatury; nie zawiera multiplayera ani zapisu stanu.

Dźwięki są generowane lokalnie przez Web Audio: silnik zależny od prędkości, szum ulicy, klawiatury siedzących członków rodziny oraz sygnały interakcji i zmiany kierowcy. Odtwarzanie zaczyna się po pierwszym kliknięciu lub naciśnięciu klawisza. Przycisk „Dźwięk” wycisza całość; pauza i ukrycie karty także wyciszają grę.
Głośność jest regulowana suwakiem w nagłówku (domyślnie 80%). Ustawienie jest zapamiętywane w tej przeglądarce. Ogranicznik dynamiki łagodzi szczyty przy większej głośności.
