# Rodzina w drodze

Samodzielny prototyp pikselowej gry inspirowany szkicem `images/car-game-design.jpg`.

Otwórz `index.html` w przeglądarce. Gra nie wymaga instalowania zależności ani kompilacji.

- **1 / 2 / 3 / 4 / 5** lub karty po prawej: wybór osoby znajdującej się w samochodzie.
- **E**: wstań, usiądź przy swoim stanowisku, przejmij kierownicę przy kabinie lub wróć do wnętrza.
- **WASD / strzałki**: chodzenie we wnętrzu; w widoku miasta W/S sterują gazem i hamulcem, A/D skręcają.
- **Spacja**: hamulec podczas jazdy.
- **P**: pauza.

Radio znajduje się na desce rozdzielczej przy przednim prawym fotelu pasażera. Wstań od stanowiska, podejdź do tego fotela i użyj **E** lub **Usiądź przy radiu**. Z fotela obsługujesz przyciski radia pod grą: poprzedni/następny utwór oraz włącznik. Na klawiaturze działa też **R** (włącz/wyłącz) i **[ / ]** (utwór). **E / Wstań z fotela** pozwala wrócić do spacerowania. Fotel zajmuje jedna osoba naraz; aby obsługiwać radio, wybierz siedzącego na nim pasażera.

Trzy własne instrumentalne utwory — „Poranna trasa”, „Słoneczne kilometry” i „Noc za oknem” — są generowane lokalnie przez Web Audio i zapętlane. Radio początkowo jest wyłączone. Muzyka gra dalej po odejściu pasażera i podczas jazdy; pauza, ukrycie karty i wyciszenie dźwięku zatrzymują odtwarzanie. Suwak głośności w nagłówku obejmuje również muzykę.

Na telefonie i urządzeniach z ekranem dotykowym pod grą pojawia się joystick i przyciski:

- **Joystick**: przeciągnij w kierunku spaceru; za kierownicą w górę dodajesz gazu, w dół hamujesz lub cofasz, a w lewo/prawo skręcasz.
- **Wstań / Usiądź / Przejmij kierownicę / Wróć do wnętrza**: przycisk zmienia opis zależnie od sytuacji.
- **Hamulec**: przytrzymaj podczas jazdy; działa jednocześnie z joystickiem i ma pierwszeństwo przed gazem.
- **Pauza / Wznów**: zatrzymuje lub wznawia grę.
- Dotknij karty Dagmary, Andrzeja lub Neli, aby wybrać postać.

Puszczenie joysticka, anulowanie dotyku, zmiana postaci, pauza i opuszczenie karty zerują sterowanie. Po obróceniu telefonu joystick wraca do środka. Aby otworzyć grę na telefonie, udostępnij pliki przez serwer WWW lub hosting i otwórz jego adres w przeglądarce telefonu.

Kierowca automatycznie jedzie ulicą, gdy rodzina jest we wnętrzu. W samochodzie są trzy stanowiska robocze, fotel pasażera z radiem i dwuosobowa kanapa. Po przejęciu kierownicy kamera odsuwa się, a dach zasłania wnętrze. Budynki zatrzymują samochód. Wnętrze ma kolizje ze stanowiskami i wyposażeniem.

Tosia i Łucja na początku czekają w dwóch miejscach przy drodze. Po przejęciu kierownicy podjedź blisko jednej z nich i użyj **E** albo mobilnego przycisku **Zabierz Tosię / Łucję**. Po zabraniu pojawi się jej karta wyboru, a dziewczynka zajmie wolne miejsce na dwuosobowej kanapie. Wszystkie osoby mogą wstawać i zajmować dowolne wolne miejsce; zajęte stanowiska są blokowane.

Grafika jest rysowana w Canvas. Dagmara, Andrzej, Nela, Tosia i Łucja mają portrety oraz twarze ze zdjęć w folderze `images`. Gra kadruje zdjęcia i przygotowuje owalne twarze lokalnie podczas wczytywania; oryginały pozostają bez zmian. Jeśli zdjęcie się nie wczyta, zostaje twarz pikselowa. Opcjonalne fonty Google mają lokalne fonty zapasowe. Prototyp obsługuje klawiaturę i ekran dotykowy; nie zawiera multiplayera ani zapisu stanu.

Dźwięki są generowane lokalnie przez Web Audio: silnik zależny od prędkości, szum ulicy, klawiatury siedzących członków rodziny oraz sygnały interakcji i zmiany kierowcy. Odtwarzanie zaczyna się po pierwszym kliknięciu lub naciśnięciu klawisza. Przycisk „Dźwięk” wycisza całość; pauza i ukrycie karty także wyciszają grę.
Głośność jest regulowana suwakiem w nagłówku (domyślnie 80%). Ustawienie jest zapamiętywane w tej przeglądarce. Ogranicznik dynamiki łagodzi szczyty przy większej głośności.
