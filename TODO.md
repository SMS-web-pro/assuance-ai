# TODO — Amélioration du "speech" des agents (100% humain, focus mobile)

## Volet A — Humaniser le texte des agents
- [x] A1. Réécrire `getSystemPrompt()` dans `ChatInterface.tsx` (ton conversationnel, personnalité par agent, RGPD naturel, emojis limités, réponses courtes)
- [x] A2. Réécrire `getInitialMessage()` dans `ChatInterface.tsx` (accueils naturels et uniques par agent)
- [x] A3. Message final naturel (guidance dans le prompt au lieu du template rigide)
- [x] A4. Réduire `max_tokens` à 500 dans `supabase/functions/chat/index.ts`

## Volet B — Naturaliser la synthèse vocale mobile
- [x] B1. Activer `splitIntoNaturalChunks()` dans `speakWithNativeAPI()` (lecture phrase par phrase avec pauses humaines)
- [x] B2. Améliorer `cleanTextForSpeech` (supprimer étapes, sections, listes)
- [x] B3. Config voix mobile adoucie (rate/pitch naturels, éviter les extrêmes)

## Volet C — Optimisation mobile spécifique
- [ ] C1. Prompt adaptatif mobile (1-2 phrases sur écran mobile)

## Tests
- [ ] T1. `npm run type-check` et `npm run build`
- [ ] T2. Vérifier le flux complet chat + voix sur mobile

