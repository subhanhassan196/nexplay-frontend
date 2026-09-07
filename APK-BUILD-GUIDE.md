# NexPlay — Android APK banane ka tareeqa

## Pehle ye samajh lo

Jo "Install" popup site pe aata hai, wo **PWA install** hai — app home screen pe aa jati hai,
apne icon ke saath full-screen chalti hai, lekin **`.apk` file nahi banti**. Wo browser ke
andar hi ek installed app hoti hai.

Asli `.apk` file (jo WhatsApp se bheji ja sake, ya Play Store pe daali ja sake) banane ke liye
ek alag build step chahiye. Isay **TWA** (Trusted Web Activity) kehte hain — Google ka apna
tareeqa jisme website ko Android app mein wrap kiya jata hai.

Config file (`twa-manifest.json`) tayyar hai. Ab bas build karna hai.

---

## Zaroori cheezein

- **Node.js** (already hai)
- **Java JDK 17** — [adoptium.net](https://adoptium.net) se download karo
- Site **live aur HTTPS pe** honi chahiye (`thisismyweb.online` — already hai ✅)

---

## STEP 1 — Bubblewrap install karo

```
npm install -g @bubblewrap/cli
```

---

## STEP 2 — Project initialize karo

`nexplay` folder mein:

```
bubblewrap init --manifest https://thisismyweb.online/manifest.json
```

Ye kuch sawaal poochega:

| Sawaal | Jawab |
|--------|-------|
| Domain | `thisismyweb.online` |
| Application name | `NexPlay` |
| Short name | `NexPlay` |
| Application ID | `online.thisismyweb.nexplay` |
| Display mode | `standalone` |
| Orientation | `portrait` |
| Status bar color | `#7C3AED` |
| Signing key — create new? | **Yes** |
| Key password | koi bhi rakho — **likh kar rakhna zaroori hai** |

⚠️ **Keystore file (`android.keystore`) aur password sambhal kar rakhna.** Ye kho gaya to
app ka update kabhi publish nahi kar paoge — naya app banana padega.

---

## STEP 3 — APK build karo

```
bubblewrap build
```

5-10 minute lagega (pehli baar Android SDK download karega).

Ban jane ke baad ye file milegi:
```
app-release-signed.apk
```

**Yahi tumhari APK hai.** WhatsApp se bhejo, phone pe install karo, chal jayegi.

---

## STEP 4 — "Chrome" address bar hatane ke liye (zaroori)

Bina is step ke app khulegi to upar URL bar dikhega. Hatane ke liye Android ko batana hoga
ke ye app us website ki hai.

**4.1** Fingerprint nikalo:
```
bubblewrap fingerprint list
```

`SHA-256` wali line copy karo.

**4.2** Ye file banao — `nexplay/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "online.thisismyweb.nexplay",
    "sha256_cert_fingerprints": ["YAHAN_APNA_SHA256_PASTE_KARO"]
  }
}]
```

**4.3** Deploy karo (git push → Vercel khud deploy kar dega)

**4.4** Check karo ke file live hai:
```
https://thisismyweb.online/.well-known/assetlinks.json
```

**4.5** APK dobara install karo — ab URL bar nahi dikhega.

---

## Play Store pe daalna ho to

1. [play.google.com/console](https://play.google.com/console) — one-time **$25**
2. Play Store `.aab` maangta hai, `.apk` nahi:
   ```
   bubblewrap build --skipPwaValidation
   ```
   `app-release-bundle.aab` upload karo
3. Review mein 1-7 din lagte hain

---

## Ek zaroori baat

TWA app **website ka live version** dikhati hai. Iska matlab jab bhi site update karoge,
app khud-ba-khud updated content dikhayegi — APK dobara banane ki zaroorat nahi.

APK sirf tab dobara banani hogi jab app ka naam, icon ya package ID badle.
