# NexPlay — Android App (APK)

## Pehle ek saaf baat

Jo "Install" popup site pe aata hai, wo **PWA install** hai — app home screen pe aa jati hai,
apne icon ke saath, full screen chalti hai, address bar nahi dikhta. Zyadatar logon ke liye
ye asli app jaisa hi lagta hai.

Lekin wo `.apk` **file** nahi hai. `.apk` banane ke liye Android package build karna padta hai
— wo browser se nahi hota, alag build step chahiye.

Neeche do raaste hain. Dono se asli `.apk` banti hai.

---

## Raasta 1 — PWABuilder (sabse aasan, 10 minute)

Koi software install nahi karna, sab browser mein.

1. [pwabuilder.com](https://www.pwabuilder.com) kholo
2. URL daalo: `https://thisismyweb.online`
3. **Start** dabao — wo manifest aur service worker check karega (dono maujood hain)
4. **Package for stores** → **Android** → **Generate Package**
5. Options mein:
   - **Package ID:** `online.thisismyweb.nexplay`
   - **App name:** NexPlay
   - **Signing key:** "Create new" choose karo
6. **Download** — ek zip milega jisme:
   - `app-release-signed.apk` ← **yahi APK hai**
   - `signing.keystore` + password file ← **inhe sambhal kar rakhna**

⚠️ **Keystore kho gaya to app update nahi kar paoge** — naya version purane ke upar install
nahi hoga. Usse Google Drive ya kisi safe jagah backup rakhna.

APK phone pe bhejo, install karo (Settings mein "Unknown sources" allow karna padega).

---

## Raasta 2 — Bubblewrap (developer tareeqa, zyada control)

Node chahiye (already hai) aur Java JDK 17.

```bash
npm install -g @bubblewrap/cli

# Ek nayi khali directory mein:
bubblewrap init --manifest https://thisismyweb.online/manifest.json

# Sawaalon ke jawab:
#   Package name: online.thisismyweb.nexplay
#   App name: NexPlay
#   Baaki default theek hain

bubblewrap build
```

`app-release-signed.apk` usi folder mein ban jayegi.

---

## Address bar hataana (Digital Asset Links)

Bina iske app khulne pe upar Chrome ka patla address bar dikhega. Hataane ke liye:

1. PWABuilder/Bubblewrap ne jo `assetlinks.json` diya hai wo lo
2. Frontend ke `public/.well-known/` folder mein rakho:
   ```
   nexplay/public/.well-known/assetlinks.json
   ```
3. Push karo, Vercel deploy hone do
4. Verify: `https://thisismyweb.online/.well-known/assetlinks.json` khulna chahiye

Ab app poori tarah full-screen chalegi, bilkul native jaisi.

---

## Play Store pe daalna (optional)

- Google Play Developer account: **$25 one-time**
- APK ki jagah **AAB** file chahiye hoti hai (PWABuilder wo bhi deta hai)
- Review mein 2-7 din lagte hain
- Privacy policy URL chahiye — `thisismyweb.online/legal/privacy` already maujood hai

Play Store zaroori nahi. APK seedha bhi share kar sakte ho — WhatsApp, link, kuch bhi.

---

## Kya pehle se ready hai

| Cheez | Status |
|-------|--------|
| `manifest.json` | ✅ |
| Icons (192, 512, maskable) | ✅ |
| Service worker | ✅ |
| Offline page | ✅ |
| HTTPS | ✅ |
| Install prompt | ✅ |

Sab kuch mojood hai — bas packaging ka step baaki hai, aur wo upar wale 10 minute wale
raaste se ho jata hai.
