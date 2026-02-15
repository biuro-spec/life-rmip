# Life RMiP - Panel Pracownika
## Prototyp MVP - Instrukcja użytkowania

---

## 📱 JAK URUCHOMIĆ

### Opcja 1: Live Server (VSCode)
1. Zainstaluj rozszerzenie "Live Server" w VSCode
2. Otwórz folder `app/`
3. Kliknij prawym na `index.html`
4. Wybierz "Open with Live Server"
5. Aplikacja otworzy się w przeglądarce

### Opcja 2: Bezpośrednio w przeglądarce
1. Otwórz `e:\CloudCOde\Life RMiP\app\index.html` w przeglądarce
2. Działa lokalnie bez serwera (localStorage)

---

## 🎯 FUNKCJE ZAIMPLEMENTOWANE

### ✅ Ekran Logowania
- Wybór pracownika (Krzysztof, Aleks, Waldemar, Dawid, Piotrek)
- Wybór karetki (1, 2, 3)
- Przycisk "Rozpocznij pracę"
- Timestamp na żywo
- Czerwony branding z prawdziwym logo

### ✅ Lista Zleceń
- Górny pasek z nazwą pracownika i karetką
- Wybór daty (strzałki < >)
- Karty zleceń z:
  - Godziną
  - Nazwiskiem pacjenta
  - Statusem (kolorowa kropka)
  - Trasą (skąd → dokąd)
- Przycisk "Odśwież"
- Wylogowanie

### ✅ Szczegóły Zlecenia
- Dane pacjenta (imię, PESEL, telefon do kliknięcia)
- Typ pacjenta (siedzący/leżący)
- Pełna trasa
- Uwagi medyczne (jeśli są)
- **Timeline statusów** z punktami:
  - ✅ Wolny/Dostępny (zielony, automatycznie)
  - ⏺ W trasie do pacjenta (czerwony, aktywny)
  - ⚪ Z pacjentem (szary, oczekujący)
- **3 przyciski akcji**:
  - 🚗 Wyruszam - zmienia status, zapisuje czas
  - ✅ Jestem u pacjenta - zmienia status, zapisuje czas
  - 🏁 Zakończono - otwiera pole kilometrów
- Pole do wprowadzenia kilometrów (ręcznie)

---

## 📝 DANE TESTOWE

### Pracownicy:
- Krzysztof
- Aleks
- Waldemar
- Dawid
- Piotrek

### Karetki:
- Karetka 1, 2, 3

### Przykładowe zlecenia dla Krzysztofa:
**08.02.2026**:
- 10:00 - Jan Kowalski (Dom → Szpital Racibórz) - Wolny
- 14:30 - Anna Nowak (Przychodnia → Dom) - W trasie
- 16:00 - Piotr Wiśniewski (Szpital → Dom) - Zaplanowane

**09.02.2026**:
- 09:00 - Maria Zielińska (Dom → POZ Krzyżanowice)

---

## 🎨 DESIGN

### Kolory:
- **Główny**: Czerwony `#B71C1C` (z logo Life)
- **Statusy**:
  - Zielony `#4CAF50` - wolny/zakończony
  - Czerwony `#FF5722` - w trasie
  - Szary `#9E9E9E` - zaplanowane

### Logo:
- Oryginalne logo Life z pliku `1.png`
- Pełna nazwa: "Life-Ratownictwo Medyczne i Pielęgniarstwo"

---

## 🔧 TECHNOLOGIE

- **HTML5** - struktura
- **CSS3** - styling (CSS Variables, Flexbox)
- **Vanilla JavaScript** - logika
- **LocalStorage** - sesja i dane lokalne

---

## 📂 STRUKTURA PROJEKTU

```
app/
├── index.html              # Ekran logowania
├── orders.html             # Lista zleceń
├── order-details.html      # Szczegóły zlecenia
├── css/
│   ├── main.css           # Design system
│   ├── login.css          # Style logowania
│   ├── orders.css         # Style listy
│   └── order-details.css  # Style szczegółów
├── js/
│   ├── utils.js           # Narzędzia (daty, storage)
│   ├── login.js           # Logika logowania
│   ├── orders.js          # Logika listy
│   ├── order-details.js   # Logika szczegółów
│   └── mockData.js        # Dane testowe
└── assets/
    └── logo.png           # Logo Life
```

---

## 🚀 NASTĘPNE KROKI

### Do zaimplementowania:
1. **Google Sheets Integration**
   - Zastąpić `mockData.js` prawdziwym API
   - Google Apps Script backend
   
2. **Integracja Cartrack GPS**
   - Automatyczne pobieranie kilometrów
   - Wyświetlanie źródła (GPS/Ręcznie)

3. **Panel Dyspozytorski (Desktop)**
   - Tworzenie nowych zleceń
   - Kalkulator cen
   - Przypisywanie pracowników

4. **Powiadomienia SMS**
   - Wysyłka SMS przy nowym zleceniu

5. **Raporty miesięczne**
   - Generowanie arkuszy rozliczeniowych

---

## 🐛 ZNANE OGRANICZENIA MVP

- Dane są tylko lokalne (mockData.js)
- Brak synchronizacji między urządzeniami
- Brak walidacji konfliktów (2 pracowników, 1 zlecenie)
- GPS Cartrack nie zaimplementowany (tylko pole ręczne)
- Brak powiadomień SMS

---

*Prototyp MVP - wersja 1.0*
*Data: 08.02.2026*
