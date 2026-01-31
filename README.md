# PageSpeed Analyzer PWA

Een professionele Progressive Web App voor het analyseren van website snelheid en prestaties. Installeerbaar op iPhone zonder App Store!

## ✨ Features

- 📊 **Complete PageSpeed analyse** - Meet alle belangrijke metrics (FCP, LCP, CLS, TTI, SI, TBT)
- 📱 **Mobiel & Desktop** - Analyseer voor beide apparaattypen
- 💾 **Analyse geschiedenis** - Bewaar en vergelijk resultaten
- 🎯 **Verbetermogelijkheden** - Concrete suggesties voor betere prestaties
- 📤 **Delen & Exporteren** - Deel resultaten of sla op als JSON
- 🔄 **Offline support** - Werkt ook zonder internetverbinding (voor opgeslagen analyses)
- 🌍 **Nederlandse interface** - Volledig in het Nederlands

## 📱 Installatie op iPhone (zonder App Store)

### Methode 1: Direct via Safari

1. **Open de app in Safari**
   - Ga naar de URL waar de app gehost is
   - De app werkt direct in de browser

2. **Installeer op het beginscherm**
   - Tik op het **deel-icoon** (vierkant met pijl omhoog) onderaan
   - Scroll omlaag en tik op **"Zet op beginscherm"**
   - Geef de app een naam (bijv. "PageSpeed")
   - Tik op **"Voeg toe"**

3. **Start de app**
   - De app verschijnt nu op je beginscherm
   - Open de app - deze werkt nu als een native app!

### Methode 2: Via QR code

1. Scan de QR code met je iPhone camera
2. Open de link in Safari
3. Volg de stappen van Methode 1

## 🚀 Hosting Opties

### Optie 1: GitHub Pages (Gratis)

1. **Upload naar GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/GEBRUIKERSNAAM/pagespeed-analyzer.git
   git push -u origin main
   ```

2. **Activeer GitHub Pages:**
   - Ga naar repository Settings
   - Klik op "Pages" in het menu
   - Selecteer "main" branch
   - Klik op "Save"

3. **Je app is live op:**
   `https://GEBRUIKERSNAAM.github.io/pagespeed-analyzer/`

### Optie 2: Netlify (Gratis, met SSL)

1. Ga naar [netlify.com](https://netlify.com)
2. Sleep de `pagespeed-analyzer` folder naar de upload zone
3. Je app is binnen 1 minuut live met een gratis SSL certificaat!

### Optie 3: Vercel (Gratis, zeer snel)

1. Installeer Vercel CLI: `npm i -g vercel`
2. Ga naar de project folder: `cd pagespeed-analyzer`
3. Run: `vercel`
4. Volg de stappen - klaar!

### Optie 4: Eigen Server

Upload alle bestanden naar je webserver via FTP of cPanel. Zorg dat HTTPS is ingeschakeld voor volledige PWA functionaliteit.

## 🔧 Technische Details

### Bestandsstructuur
```
pagespeed-analyzer/
├── index.html          # Hoofdpagina
├── styles.css          # Styling
├── app.js             # JavaScript applicatie
├── sw.js              # Service Worker (offline support)
├── manifest.json      # PWA manifest
├── icon-*.png         # App iconen (verschillende maten)
└── README.md          # Deze documentatie
```

### Browser Ondersteuning

- ✅ Safari (iOS 11.3+)
- ✅ Chrome (Android & Desktop)
- ✅ Firefox
- ✅ Edge
- ✅ Samsung Internet

### PWA Features

- **Standalone mode** - App draait volledig standalone (geen browser UI)
- **Service Worker** - Offline ondersteuning en snellere laadtijden
- **App Manifest** - Native app-achtige ervaring
- **Installeerbaar** - Kan geïnstalleerd worden op beginscherm
- **Responsive** - Werkt op alle schermformaten

## 🔐 Privacy & Beveiliging

- **Geen tracking** - Deze app verzamelt geen persoonlijke gegevens
- **Lokale opslag** - Alle geschiedenis wordt lokaal op je apparaat opgeslagen
- **Geen server** - Analyses worden rechtstreeks naar Google PageSpeed API gestuurd
- **Open source** - Alle code is transparant en te inspecteren

## 💡 Gebruik

1. **Voer een URL in** - Type de website die je wilt analyseren
2. **Kies het apparaat** - Selecteer Mobiel of Desktop
3. **Start de analyse** - Tik op "Analyseren"
4. **Bekijk resultaten** - Zie de score en gedetailleerde metrics
5. **Verbeter je site** - Gebruik de suggesties om je website sneller te maken

## 🎨 Aanpassingen

### Kleuren aanpassen

Open `styles.css` en wijzig de CSS variabelen:

```css
:root {
    --primary-color: #1a73e8;      /* Hoofdkleur */
    --success-color: #0cce6b;      /* Goede scores */
    --warning-color: #ffa400;      /* Gemiddelde scores */
    --danger-color: #ff4e42;       /* Slechte scores */
}
```

### Logo aanpassen

De iconen kun je vervangen door je eigen logo's. Zorg voor dezelfde afmetingen:
- icon-72.png tot icon-512.png

### Teksten aanpassen

Alle teksten staan in `index.html` en zijn eenvoudig aan te passen.

## 🐛 Problemen Oplossen

### App installeert niet op iPhone
- Zorg dat je Safari gebruikt (niet Chrome of andere browsers)
- Controleer of de website via HTTPS wordt gehost
- Probeer de pagina te verversen (swipe down)

### Analyses werken niet
- Controleer je internetverbinding
- Sommige websites blokkeren PageSpeed analyses
- De Google PageSpeed API heeft rate limiting (max. 25 aanvragen per seconde)

### Service Worker updates niet
- Open de app in Safari
- Ga naar Settings > Safari > Clear History and Website Data
- Installeer de app opnieuw

## 📊 API Informatie

Deze app gebruikt de **Google PageSpeed Insights API v5**. Voor productiegebruik kun je een eigen API key aanvragen:

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project
3. Activeer PageSpeed Insights API
4. Genereer een API key
5. Voeg de key toe in `app.js`:

```javascript
const API_KEY = 'JOUW_API_KEY_HIER';
```

**Let op:** Voor demo doeleinden werkt de app ook zonder API key, maar dan met beperkte functionaliteit.

## 🤝 Bijdragen

Suggesties en verbeteringen zijn welkom! Open een issue of pull request.

## 📄 Licentie

MIT License - Vrij te gebruiken en aan te passen voor eigen doeleinden.

## 👨‍💻 Credits

Ontwikkeld met ❤️ voor snelle websites.

## 📞 Support

Vragen? Open een issue op GitHub of neem contact op.

---

**Tip:** Voor de beste ervaring, installeer de app op je beginscherm en gebruik hem als een native app!
