# Scan-knap med kamera-modal — Design

## Baggrund

`app/components/ImageUploader.tsx` bruger i dag `react-dropzone` (træk-og-slip +
filvælger) til at få et billede af en ingrediensliste. På mobil åbner filinputtet
OS'ets kamera/galleri. Vi vil i stedet have en in-app oplevelse: en **scan-knap**
der åbner en kamera-modal med live-kamera, hvor brugeren tager billedet direkte i
appen og bekræfter det, før det uploades og parses.

## Mål

- Erstatte dropzone/upload **helt** med en scan-knap der åbner en kamera-modal.
- Live-kamera-feed i modalen med udløser, forhåndsvisning og "tag om"/"brug billede".
- Genbruge det eksisterende upload/parse-flow uændret.

## Ikke-mål (YAGNI)

- Ingen filupload-fallback. Hvis kameraet ikke kan tilgås, vises kun en fejlbesked.
- Ingen billedredigering (beskæring, rotation, zoom).
- Ingen ændringer i `/api/parseIngredient`, Supabase-upload eller resultat-grid.
- Ingen valg mellem flere kameraer i UI (vi beder bare om bagudvendt kamera).

## Arkitektur

### Ny komponent: `app/components/CameraModal.tsx` (client component)

**Props**

```ts
interface CameraModalProps {
  onCapture: (file: File) => void; // kaldes når brugeren bekræfter et billede
  onClose: () => void;             // kaldes ved luk (X, baggrundsklik, Escape)
}
```

**Intern state**

- `view: "live" | "preview"` — hvilket trin modalen viser.
- `previewUrl: string | null` — object-URL for det tagne stillbillede (preview).
- `error: string | null` — sat hvis `getUserMedia` fejler.

**Refs**

- `videoRef` — `<video>`-elementet der viser live-feed.
- `canvasRef` — skjult `<canvas>` brugt til at fange et frame.
- `streamRef` — den aktive `MediaStream` (så tracks kan stoppes ved cleanup).
- `capturedBlobRef` — den fangede `Blob` (holdes indtil "Brug billede").

**Adfærd**

1. **Åbning / kamerastart** (`useEffect` ved mount):
   - Kald `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`.
     Bagudvendt kamera foretrækkes (godt til labels på mobil); browseren falder
     selv tilbage til det tilgængelige kamera på desktop.
   - Sæt stream på `videoRef.current.srcObject`, gem i `streamRef`.
   - Ved fejl/afvisning: sæt `error` til en brugervenlig besked.
2. **Live-trin** (`view === "live"`):
   - `<video autoPlay playsInline muted>` fylder panelet.
   - Udløser-knap: tegn `videoRef` ind i `canvasRef` (sat til videoens
     `videoWidth`/`videoHeight`), kald `canvas.toBlob(blob => ...)` med
     `image/jpeg`. Gem blob i `capturedBlobRef`, lav `previewUrl` via
     `URL.createObjectURL(blob)`, skift til `view = "preview"`.
   - Luk-knap (X) → `onClose()`.
3. **Preview-trin** (`view === "preview"`):
   - Vis det tagne billede (`previewUrl`) med `next/image` eller `<img>`.
   - "Tag om": revoke `previewUrl`, ryd `capturedBlobRef`, skift til `view = "live"`.
   - "Brug billede": pak `capturedBlobRef` som en `File`
     (`new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" })`),
     kald `onCapture(file)`. Forælderen lukker modalen.
4. **Fejl-trin** (`error !== null`):
   - Vis fejlbeskeden ("Kunne ikke få adgang til kameraet. Giv tilladelse og prøv
     igen.") og en luk-knap. Intet live-feed, ingen filupload.
5. **Oprydning** (`useEffect`-cleanup ved unmount):
   - Stop alle tracks: `streamRef.current?.getTracks().forEach(t => t.stop())`.
   - Revoke en evt. `previewUrl`.

**UI / styling**

- Fast-positioneret overlay (`fixed inset-0`) med halvgennemsigtig baggrund og et
  centreret panel. Tailwind-utility-klasser i kodebasens stil; brug `cn()` hvor
  betinget styling er nødvendig.
- Let fade-in på overlay/panel med framer-motion (matcher eksisterende brug).
- Luk på baggrundsklik og på Escape-tast (key-listener i `useEffect`).
- Ikoner fra `@heroicons/react` (fx `CameraIcon`, `XMarkIcon`, `ArrowPathIcon`).

### Ændringer i `app/components/ImageUploader.tsx`

- Fjern `import Dropzone from "react-dropzone"` og hele `<Dropzone>`-blokken i
  `status === "initial"`.
- Tilføj `const [showCamera, setShowCamera] = useState(false)`.
- I `status === "initial"`-blokken: render en **scan-knap** (kamera-ikon + tekst,
  fx "Scan ingredient list") der sætter `setShowCamera(true)`. Behold
  "Need an example image? Try here."-knappen uændret.
- Render `{showCamera && <CameraModal onClose={() => setShowCamera(false)}
  onCapture={(file) => { setShowCamera(false); handleFileChange(file); }} />}`.
- `handleFileChange(file: File)` er uændret og driver hele upload/parse-flowet.

### Uberørt

`handleFileChange`, `uploadImageToSupabase`, `/api/parseIngredient`,
`IngredientGrid`, søgning/filter, `handleExampleImage`, og resten af
`ImageUploader` forbliver som de er.

## Datastrøm

1. Bruger trykker scan-knap → `showCamera = true` → `CameraModal` mountes.
2. Modal starter kamera, bruger tager billede → preview.
3. Bruger trykker "Brug billede" → `onCapture(file)`.
4. `ImageUploader` lukker modal og kalder `handleFileChange(file)`.
5. Eksisterende flow: `uploadImageToSupabase` → POST `/api/parseIngredient` →
   render resultater. Uændret.

## Fejlhåndtering

- **Kamera-adgang afvist / intet kamera:** modalen viser kun en fejlbesked +
  luk-knap. Ingen fallback.
- **`canvas.toBlob` giver `null`:** bliv på live-trinnet (ingen skift til preview);
  brugeren kan trykke udløseren igen.
- **Upload/parse-fejl:** håndteres allerede af `handleFileChange` (sætter
  `status = "error"` og viser "Try Again").

## Test

Intet testframework er konfigureret i projektet. Manuel verifikation:

- Desktop med webcam: scan-knap åbner modal, live-feed vises, optag → preview →
  "Brug billede" kører upload/parse.
- "Tag om" vender tilbage til live-feed.
- Afvis kamera-tilladelse → kun fejlbesked vises.
- Luk modal (X, baggrundsklik, Escape) stopper kameraet (kamera-indikator slukker).
- Mobil: bagudvendt kamera bruges som standard.

## Afhængigheder

- Ingen nye pakker. `react-dropzone` kan forblive installeret (bruges ikke længere
  i ImageUploader); fjernelse fra `package.json` er valgfrit og uden for scope.
