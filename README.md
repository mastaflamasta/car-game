# Rodzina w drodze

Samodzielny prototyp pikselowej gry inspirowany szkicem `images/car-game-design.jpg`.

Uruchom grę przez PHP (minimum PHP 8), na przykład `php -S localhost:8080`, i otwórz `http://localhost:8080`. Serwer jest potrzebny do zapisywania postaci i Tablicy; gra nie wymaga kompilacji ani instalowania pakietów.

- **1 / 2 / 3 / 4 / 5** lub karty po prawej: wybór osoby znajdującej się w samochodzie.
- **E**: wstań, usiądź przy swoim stanowisku, przejmij kierownicę przy kabinie lub wróć do wnętrza.
- **WASD / strzałki**: chodzenie we wnętrzu; w widoku miasta W/S sterują gazem i hamulcem, a A/D skręcają.
- **P**: pauza.

Dolne drzwi samochodu prowadzą teraz do szkolnej przyczepki — podejdź do nich i naciśnij **E**. Nowe drzwi na prawej ścianie, obok fotela z radiem, prowadzą na zewnątrz za pomocą standardowej akcji **E** lub mobilnego przycisku interakcji.

Każda osoba może wysiąść. Gdy ostatnia osoba opuszcza samochód, auto zatrzymuje się i gra przechodzi do trybu spaceru po mieście. Postacie poruszają się po mapie standardowym joystickiem lub klawiszami WASD. Zaparkowany samochód ma własny złoty wskaźnik kierunku; po podejściu można wrócić do środka. Na mapie można znaleźć oznaczone sklepy i stacje benzynowe.

W szkolnej przyczepce znajdują się dwa rzędy po trzy jednoosobowe ławki, stolik nauczyciela oraz tablica kredowa. Przy ławkach i miejscu nauczyciela siada się klawiszem **E**. Każda osoba może podejść do tablicy, nacisnąć **E**, rysować białą kredą i ścierać wybrane fragmenty gąbką. **Esc** zapisuje obraz tablicy na serwerze i wraca do klasy; kolejna osoba zobaczy zapisaną zawartość.

W **Ustawieniach** znajduje się pula postaci przechowywana na serwerze. Kreator pozwala podać imię i kolor ubrania, wysłać zdjęcie oraz wybrać kadr głowy za pomocą Cropper.js. Przed zapisem pokazuje gotową postać. Serwer zapisuje oryginalne zdjęcie, wykadrowany portret, kolor, imię i parametry kadru. Postać z puli można dodać do trwającej gry; trafia do aktualnie oglądanego samochodu lub szkoły, a w widoku miasta pojawia się obok auta.

Dane runtime znajdują się w `data/` (katalog musi być zapisywalny dla procesu PHP). Endpointy to `GET/POST api/characters.php` oraz `GET/PUT api/board.php`. Kreator przyjmuje JPG, PNG lub WebP i przed wysłaniem optymalizuje duże fotografie do limitu 2 MB zgodnego z typową konfiguracją PHP.

Oddzielny panel zarządzania postaciami znajduje się pod adresem `editor.php`. Hasło początkowe to `edytor4321`. Po zalogowaniu można zmienić imię i kolor ubrania albo usunąć postać wraz z zapisanymi zdjęciami. Operacje zapisu i usuwania są chronione sesją PHP oraz tokenem CSRF.

Radio znajduje się na desce rozdzielczej przy przednim prawym fotelu pasażera. Wstań od stanowiska, podejdź do tego fotela i użyj **E** lub **Usiądź przy radiu**. Z fotela obsługujesz przyciski radia pod grą: poprzedni/następny utwór oraz włącznik. Na klawiaturze działa też **R** (włącz/wyłącz) i **[ / ]** (utwór). **E / Wstań z fotela** pozwala wrócić do spacerowania. Fotel zajmuje jedna osoba naraz; aby obsługiwać radio, wybierz siedzącego na nim pasażera.

Sześć własnych instrumentalnych utworów jest generowanych lokalnie przez Web Audio i zapętlanych. Ostatnią, siódmą pozycją jest „Liberian Girl”, odtwarzana w pętli z pliku `music/liberian-girl.ogg`. Jej odnalezienie odblokowuje specjalny achievement. Radio początkowo jest wyłączone. Muzyka gra dalej po odejściu pasażera i podczas jazdy; pauza, ukrycie karty i wyciszenie dźwięku zatrzymują odtwarzanie. Suwak głośności w nagłówku obejmuje również muzykę z pliku.

Pogoda czasem zmienia się na deszczową. Podczas jazdy i spaceru deszcz jest widoczny jako pikselowe smugi oraz krótkie rozpryski, a we wnętrzu samochodu słychać krople uderzające o dach. Okresy bez deszczu są wyraźnie dłuższe od samych opadów.

Na telefonie i urządzeniach z ekranem dotykowym pod grą pojawia się joystick i przyciski:

- **Joystick podczas chodzenia**: przeciągnij w dowolnym kierunku, aby poruszać postacią.
- **Kierownica podczas jazdy**: ten sam kontroler działa wyłącznie w poziomie i skręca samochód w lewo lub prawo.
- **Gaz i hamulec**: osobne przyciski można trzymać równocześnie z kierownicą; hamulec po zatrzymaniu uruchamia jazdę wstecz.
- **Wstań / Usiądź / Przejmij kierownicę / Wróć do wnętrza**: przycisk zmienia opis zależnie od sytuacji.
- **Pauza / Wznów**: zatrzymuje lub wznawia grę.
- Dotknij karty Dagmary, Andrzeja lub Neli, aby wybrać postać.

Puszczenie joysticka lub pedału, anulowanie dotyku, zmiana postaci, pauza i opuszczenie karty zerują sterowanie. Po obróceniu telefonu joystick wraca do środka. Aby otworzyć grę na telefonie, udostępnij pliki przez serwer WWW lub hosting i otwórz jego adres w przeglądarce telefonu.

Kierowca automatycznie jedzie ulicą, gdy rodzina jest we wnętrzu. W samochodzie są trzy stanowiska robocze, fotel pasażera z radiem i dwuosobowa kanapa. Po przejęciu kierownicy kamera odsuwa się, a dach zasłania wnętrze. Budynki zatrzymują samochód. Wnętrze ma kolizje ze stanowiskami i wyposażeniem.

Każda osoba siedząca przy jednym z trzech komputerów zarabia 2 monety na sekundę. Nad aktywnym stanowiskiem pojawiają się krótkie animacje monet, a licznik **KASA** u góry ekranu pokazuje wspólny wynik. Fotel radia, kanapa, chodzenie i prowadzenie samochodu nie generują pieniędzy. Jeśli nikt nie pracuje przy komputerze, licznik się nie zwiększa.

Osoby w samochodzie od czasu do czasu pokazują krótki komentarz zależny od zajmowanego miejsca. Pracownik może też losowo zasnąć przy komputerze: jego sylwetka opuszcza się, a nad głową pojawia się `Z`. Śpiąca osoba nie zarabia pieniędzy. Należy podejść inną postacią i użyć interakcji **Obudź**, aby wróciła do pracy.

## Achievementy

Achievementy pojawiają się jako karta wjeżdżająca z prawej strony wraz z krótkim dźwiękiem. Kliknięcie w ekran chowa kartę, a każde osiągnięcie wyświetla się tylko raz podczas jednej rozgrywki. Restart gry rozpoczyna nową rozgrywkę i zeruje achievementy oraz próby przekonania Kasi. Kasia odmawia wejścia do samochodu cztery razy (z naburmuszonym portretem), po czym za piątym razem dołącza do rodziny i odblokowuje achievement **Kasia przyjęta do rodziny (Spotify)**. Drugi achievement odblokowuje się, gdy Nela, Tosia i Łucja jednocześnie pracują przy trzech komputerach.

Licznik z pucharem pokazuje liczbę zdobytych achievementów. Dostępne są także osiągnięcia za zebranie całej rodziny, jednoczesną pracę rodziców, zdobycie 2000 monet, prowadzenie przez każdą osobę, pięć kolizji oraz dwadzieścia przytuleń jednego dziecka.

Tosia i Łucja na początku czekają w dwóch miejscach przy drodze. Po przejęciu kierownicy podjedź blisko jednej z nich i użyj **E** albo mobilnego przycisku **Zabierz Tosię / Łucję**. Po zabraniu pojawi się jej karta wyboru, a dziewczynka zajmie wolne miejsce na dwuosobowej kanapie. Wszystkie osoby mogą wstawać i zajmować dowolne wolne miejsce; zajęte stanowiska są blokowane.
Podczas jazdy kompas na krawędzi ekranu pokazuje kierunek do najbliższej oczekującej osoby, jej zdjęcie i przybliżoną odległość.

Grafika jest rysowana w Canvas. Dagmara, Andrzej, Nela, Tosia i Łucja mają portrety oraz twarze ze zdjęć w folderze `images`. Gra kadruje zdjęcia i przygotowuje owalne twarze lokalnie podczas wczytywania; oryginały pozostają bez zmian. Jeśli zdjęcie się nie wczyta, zostaje twarz pikselowa. Opcjonalne fonty Google mają lokalne fonty zapasowe. Prototyp obsługuje klawiaturę i ekran dotykowy; nie zawiera multiplayera ani zapisu stanu.

Przycisk **Ustawienia** pozwala przełączać wygląd wszystkich postaci między fotografiami i grafikami `*-pixel.png` z przezroczystym tłem. Wybrany styl obejmuje postacie w samochodzie, karty oraz znaczniki na mapie i jest zapamiętywany w `localStorage`. Styl można też zmienić z kodu przez `window.setCharacterStyle('photo')` lub `window.setCharacterStyle('pixel')`.

Dźwięki są generowane lokalnie przez Web Audio: silnik zależny od prędkości, szum ulicy, klawiatury siedzących członków rodziny oraz sygnały interakcji i zmiany kierowcy. Odtwarzanie zaczyna się po pierwszym kliknięciu lub naciśnięciu klawisza. Przycisk „Dźwięk” wycisza całość; pauza i ukrycie karty także wyciszają grę.
Głośność jest regulowana suwakiem w nagłówku (domyślnie 80%). Ustawienie jest zapamiętywane w tej przeglądarce. Ogranicznik dynamiki łagodzi szczyty przy większej głośności.
