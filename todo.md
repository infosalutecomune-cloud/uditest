# VoiceCheck — TODO

## Fix STT / Registrazione vocale
- [x] Aggiungere endpoint backend POST /api/transcribe con Whisper via Forge API
- [x] Sostituire Web Speech API con MediaRecorder nel frontend (registra WebM/OGG, invia al backend)
- [x] Mostrare indicatore volume durante registrazione (Web Audio API AnalyserNode)
- [x] Gestire permesso microfono negato con messaggio chiaro

## Matrice completa (SiIMax 3x7)
- [x] Generare 21 token audio TTS (7 numeri, 7 nomi, 7 aggettivi)
- [x] Caricare i 21 token audio su S3 via manus-upload-file
- [x] Implementare motore matrice: generazione casuale lista 14 frasi
- [x] Aggiornare testData.ts con la matrice 3x7 e la funzione generaLista()
- [x] Aggiornare Test.tsx per usare la matrice generata dinamicamente

## Calibrazione ambiente
- [x] Aggiungere step calibrazione ambiente nella pagina Calibrazione.tsx
- [x] Misurare rumore di fondo con microfono (3 secondi, livello RMS)
- [x] Semaforo verde/giallo/rosso per rumore ambiente
- [x] Aggiungere istruzioni distanza dal telefono (30-50 cm)
- [x] Aggiungere istruzioni posizione (seduto, posto silenzioso, cuffie consigliate)

## Audiometria tonale (screening)
- [x] Aggiungere sezione "Test dei Toni" nella Home
- [x] Generare toni puri a 500, 1000, 2000, 4000 Hz con Web Audio API
- [x] Procedura semplificata: utente indica se sente o non sente ogni tono
- [x] Mostrare risultato per frequenza (sente/non sente) con disclaimer screening
- [x] Aggiungere disclaimer che i valori sono indicativi

## Form contatto + WhatsApp
- [x] Aggiungere form contatto nella pagina Risultati (nome, telefono)
- [x] Aggiungere bottone WhatsApp che apre wa.me con testo pre-compilato con risultato test
- [x] Sostituire numero telefono placeholder con numero reale Acustica Di Maio (3341990307)

## Privacy GDPR
- [x] Aggiungere schermata privacy GDPR prima di iniziare il test
- [x] Checkbox consenso privacy obbligatorio (D.Lgs. 196/2003 e GDPR 2016/679)
- [x] Checkbox consenso microfono obbligatorio
- [x] Testo privacy policy sintetico
- [x] Bottone "Accetta e Inizia" disabilitato finché non si accettano entrambi

## Completati
- [x] Struttura base app con routing
- [x] Header con logo Acustica Di Maio
- [x] Pagina Home con spiegazione test + Test Toni
- [x] Pagina Calibrazione audio (3 step: posizione, rumore, volume)
- [x] Pagina Test con procedura adattiva SNR e MediaRecorder+Whisper
- [x] Pagina Risultati con SRT50, grafico e form WhatsApp
- [x] 21 token audio TTS caricati su S3
- [x] Algoritmo Levenshtein per confronto parole
- [x] Indicatore volume barre animate
- [x] Pagina AudiometriaTonale con 4 frequenze
- [x] Pagina Privacy con consensi GDPR
- [x] Routing aggiornato con step 'audiometria' e 'privacy'

## Rebranding UditoFacile + UX Home
- [x] Rinominare app da "VoiceCheck" a "UditoFacile" in titoli, metadata, index.html
- [x] Home: 2 tasti grandi (Test Vocale + Test dei Toni) + disclaimer screening
- [x] Creare pagina IntroVocale con spiegazione completa + avvio test vocale
- [x] Creare pagina IntroTonale con spiegazione completa + avvio test tonale
- [x] Logo cliccabile come tasto di ritorno alla home in AppHeader e tutte le pagine
- [x] Aggiornare routing con step 'intro-vocale' e 'intro-tonale'

## PDF Risultati
- [x] Generazione PDF vocale lato client (jsPDF): logo, SRT50, grafico, scala riferimento, disclaimer
- [x] Generazione PDF tonale lato client (jsPDF): logo, risultati per frequenza, significato clinico, disclaimer
- [x] Bottone "Scarica PDF" in Risultati.tsx (test vocale)
- [x] Bottone "Scarica PDF" in AudiometriaTonale.tsx (test tonale)

## Fix test tonale bloccato + pulsante Annul- [x] Fix test tonale bloccato: floor check VOLUME_MIN, limite 15 toni, avanzamento automaticoq successiva- [x] Aggiungere pulsante Annulla/Esci in AudiometriaTonale (tutte le fasi) del test)- [x] Aggiungere pulsante Annulla/Esci in Test.tsx (tutte le fasi) del test vocale)
- [x] Aggiungere pulsante Annulla/Esci in Calibrazione.tsx
- [x] Aggiungere pulsante Annulla/Esci in IntroVocale.tsx
- [x] Aggiungere pulsante Annulla/Esci in IntroTonale.tsx
- [x] Aggiungere calibrazione (posizione, rumore ambiente, volume) anche prima del test tonale — routing: intro-tonale → calibrazione-tonale → audiometria

## Fix PDF tonale
- [x] Fix bug semaforo rosso nel PDF quando tutti i risultati sono verdi (calcolo risultato globale errato)
- [x] Aggiornare disclaimer: rimuovere "audiologo/medico ORL", includere audioprotesista e audiometrista
- [x] Rivedere/semplificare le descrizioni delle frequenze nel PDF tonale
- [x] Aggiungere sezione nel PDF tonale (e vocale) sull'importanza dell'udito: umore, vita sociale, sicurezza
- [x] Rendere il disclaimer più visibile nel footer PDF (sfondo colorato, testo più grande)
- [x] Mettere WhatsApp in primo piano nei contatti del footer PDF
- [x] Aggiungere banner CTA "Prenota una visita" nella pagina risultati vocale (Risultati.tsx) con link a https://www.acusticadimaio.it/contatta-e-prenota/
- [x] Aggiungere banner CTA "Prenota una visita" nella pagina risultati tonale (AudiometriaTonale.tsx) con link a https://www.acusticadimaio.it/contatta-e-prenota/

## Miglioramenti UX home e test vocale
- [x] Aggiungere dialog di conferma "Annulla" nel test vocale (uniformare al test tonale)
- [x] Header home: rimuovere nome app e onde animate, lasciare solo logo a sinistra su sfondo bianco
- [x] Rinominare "Test dei Toni" in "Audiometria Tonale" nella home
- [x] Riscrivere testo introduttivo home: più professionale, spiegare cosa fa l'app, rimuovere "gratis" come gancio
- [x] Aggiungere frequenze 750, 1500 e 3000 Hz al test tonale (AudiometriaTonale.tsx + generaPDF.ts)
- [x] Aggiungere audiogramma grafico nel PDF tonale (asse X = frequenze, asse Y = dB HL, punti colorati per soglia)
- [x] Aggiungere grafico SNR visivo nel PDF vocale (barra colorata verde/giallo/rosso con indicatore del risultato e norma)

## Prossimi passi
- [x] Aggiungere tono di calibrazione 1000 Hz in CalibrazioneTonale (pulsante "Ascolta il tono" nello step volume) — già presente
- [x] Aggiornare tempo stimato audiometria tonale nella home da ~2 minuti a ~5 minuti

## Anagrafica paziente e condivisione referto
- [x] Creare pagina/modal Anagrafica (nome, cognome, data di nascita, comune) con salvataggio in localStorage
- [x] Mostrare la schermata anagrafica al primo avvio (se dati non presenti) e renderla accessibile dalla home
- [x] Aggiungere step "Conferma dati" prima di generare il PDF (modal precompilato con dati salvati, modificabile)
- [x] Includere nome, cognome, data di nascita e comune nel PDF generato (vocale e tonale)
- [x] Aggiungere pulsante "Condividi il referto" esplicito (testo grande + icona WhatsApp) nei risultati vocale e tonale
- [x] Mostrare automaticamente la schermata anagrafica al primo avvio quando non ci sono dati salvati
- [x] Sostituire icona Share2 con logo WhatsApp SVG nei pulsanti "Condividi il referto"

## Storico dei test
- [x] Creare hook useStorico per salvare/caricare i risultati dei test in localStorage (max 20 voci)
- [x] Salvare automaticamente il risultato del test vocale in Risultati.tsx
- [x] Salvare automaticamente il risultato dell'audiometria tonale in AudiometriaTonale.tsx
- [x] Mostrare lo storico nella home (sezione collassabile con le ultime voci)
- [x] Permettere di cancellare lo storico dalla pagina Anagrafica

## Fix link e rinomina
- [x] Fix link al sito acusticadimaio.it nella home (non aprono)
- [x] Rinominare "Audiometria Tonale" in "Test Tonale" nella home e in tutte le pagine
- [x] Rimuovere tutte le occorrenze di "opzionale/opzionali" dall'anagrafica (titolo, sottotitolo, testo)
- [x] Aggiungere campo numero di cellulare in Anagrafica.tsx e hook useAnagrafica
- [x] Aggiornare ModalConfermaAnagrafica per mostrare il cellulare
- [x] Includere cellulare nel PDF generato

## Fix bug 7 frequenze test tonale
- [x] Fix closure stale in avanzaFrequenza: usa useRef per avviaFrequenza così tutte e 7 le frequenze vengono testate
- [x] Aggiornare testi in IntroTonale.tsx da "4 frequenze" a "7 frequenze"
- [x] Aggiungere spiegazione nell'intro test tonale: lo stesso tono può ripresentarsi più volte (sistema adattivo)

## Rebranding UdiTest + Home semplificata
- [x] Rinominare app da "VoiceCheck" / "UditoFacile" a "UdiTest" ovunque (titolo, PDF, metadati, VITE_APP_TITLE)
- [x] Home: rimuovere hero testuale, storico, spiegazioni dei test — lasciare solo i due tasti esami + disclaimer
- [x] Disclaimer nella home: ben visibile, con sfondo/bordo colorato
- [x] Aggiungere testo introduttivo nelle pagine IntroVocale e IntroTonale: "Sentire bene è vivere meglio..."
- [x] Rimuovere le spiegazioni dei test dalla home (le descrizioni vanno nelle pagine intro dei test)

## Aggiornamenti finali
- [x] Aggiornare titolo progetto a "UdiTest" nel pannello di gestione — da fare manualmente in Settings → General (non modificabile via codice)
- [x] Aggiungere età calcolata nel PDF (data di nascita → età al momento del test)
- [x] Header: non aggiungere altri elementi oltre al logo e al pulsante profilo esistente

## Layout home aggiornato
- [x] Home: testo "Sentire bene è vivere meglio" in cima, due tasti affiancati più piccoli, disclaimer con "Questo è solo uno screening" in grassetto e resto a capo
- [x] IntroVocale e IntroTonale: rimuovere il testo "Sentire bene è vivere meglio..." dall'hero, lasciare solo la descrizione specifica del test

## Home: pulsante Prenota e saluto
- [x] Aggiungere pulsante "Prenota una visita" nella home sotto i tasti dei test (link a acusticadimaio.it/contatta-e-prenota/)
- [x] Aggiungere saluto personalizzato "Ciao, [Nome]" nella home quando l'utente ha già inserito i dati

## Home: WhatsApp e disclaimer
- [x] Aggiungere pulsante WhatsApp verde "Scrivi su WhatsApp / Richiedi informazioni" affiancato al tasto Prenota una visita
- [x] Disclaimer: sostituire la frase finale con "Rivolgiti ad un professionista qualificato."

## WhatsApp risultati e messaggio precompilato
- [x] Aggiungere pulsante WhatsApp nelle pagine risultati vocale e tonale (già presenti)
- [x] Aggiungere messaggio precompilato su tutti i link WhatsApp (home + risultati)

## Richieste utente 07/05/2026 — Test Vocale
- [ ] Aggiungere pulsante "Ripeti" (ri-registra) nella fase di conferma risposta — permette di rifare la registrazione se il microfono ha captato male
- [ ] Aggiungere pulsante "Riascolta" nella fase di ascolto — permette di risentire la frase audio prima di rispondere
- [ ] Revisione qualità file audio delle 21 parole del test vocale (utente vuole ascoltarli e segnalare quelli non chiari)
- [ ] Correggere le parole non intelligibili dopo feedback utente

## Richieste utente 07/05/2026 — Home + Storico + PDF combinato
- [x] Home: disclaimer centrato sotto i pulsanti dei test
- [x] Home: invertire posizione pulsanti — WhatsApp a sinistra, Prenota a destra
- [x] Storico esami: salvataggio persistente degli esami nell'app (vocale + tonale) consultabile dalla home
- [x] PDF combinato: nella pagina risultati permettere di generare PDF del singolo esame oppure di tutti e tre gli esami insieme

## Bug e revisioni 07/05/2026 — segnalati dall'utente
- [ ] BUG: Test vocale si blocca — non avanza dopo la registrazione
- [ ] BUG: Test tonale si blocca — non accetta il secondo SÌ e non avanza alla frequenza successiva
- [ ] PDF tonale: colori zone del grafico troppo accentuati, renderli più tenui
- [ ] PDF tonale: rimuovere la tabella frequenza per frequenza, lasciare solo grafico + 2 righe di spiegazione
- [ ] PDF tonale: fix carattere strano nel footer prima del numero di telefono

## Bug segnalati 07/05/2026 (secondo round)
- [ ] Home: disclaimer tra pulsanti test e pulsanti WhatsApp/Prenota
- [ ] Riconoscimento vocale: migliorare match (fuzzy, soglia più bassa)
- [ ] PDF vocale senza rumore: rimuovere SRT, correggere logica punteggio
- [x] PDF combinato: includere tutti e 3 gli esami
- [ ] PDF tonale: colori pastello chiarissimi nel grafico
- [ ] Grafico vocale: cursore rosso invisibile su sfondo rosso
- [ ] Logica punteggio vocale: 80% non deve dare deficit

## Richieste utente 07/05/2026 (batch 3)
- [ ] Fix loop infinito test tonale: accettare secondo SÌ alla stessa intensità e avanzare
- [ ] Soglie vocali: rimuovere SRT ovunque, usare solo % con soglie concordate (rumore: >=80% norma, 60-79% lieve, 40-59% moderato, <40% significativo; silenzio: >=90% norma, 70-89% lieve, 50-69% moderato, <50% significativo)
- [ ] PDF tonale: ripristinare grafico audiogramma con colori pastello su foglio unico A4
- [ ] Revisione lista parole test vocale

## Calibrazione avanzata (da fare dopo i bug critici)
- [ ] Calibrazione tonale: attivare microfono durante la riproduzione del tono di riferimento 1000 Hz e misurare il livello di uscita del dispositivo (SPL indicativo) per una calibrazione più professionale

## Fix riconoscimento vocale e SNR adattivo
- [x] Fix normalizzaParola: rimuovere punteggiatura Whisper (. ! ? , ecc.)
- [x] Fix normalizzaParola: convertire cifre in parole (2→due, 3→tre, ecc.)
- [x] Test vocale nel rumore: rendere SNR semi-adattivo (scende se corretto, sale se sbagliato)

## Protezione e accesso (07/05/2026)
- [x] Aggiungere footer copyright © 2026 Acustica Di Maio in tutte le pagine dell'app
- [x] Attivare registrazione/login obbligatorio prima di poter fare il test
- [ ] Inserire pulsante UdiTest nella pagina Servizi di acusticadimaio.it

## Refactoring UX: test libero + sblocco PDF con dati (07/05/2026)
- [x] Rimuovere il gate di autenticazione Manus OAuth dalla Home (test accessibile senza login)
- [x] Rimuovere pulsante Logout dall'header Home
- [x] Creare pagina/modal "SbloccaReferto" che appare DOPO il test, prima di generare il PDF
- [x] SbloccaReferto: form con nome, cognome, email, cellulare (email obbligatoria)
- [x] SbloccaReferto: checkbox consenso privacy GDPR (obbligatorio)
- [x] SbloccaReferto: checkbox consenso marketing (opzionale) — "Accetto di essere contattato da Acustica Di Maio per offerte e promozioni"
- [x] SbloccaReferto: salva dati nel DB via tRPC (tabella leads) + notifica owner
- [x] Risultati.tsx e AudiometriaTonale.tsx: sostituire pulsante "Scarica PDF" diretto con pulsante "Sblocca e scarica il referto" che apre SbloccaReferto
- [x] Se l'utente ha già compilato i dati in precedenza (localStorage), pre-compilare il form e mostrare solo i consensi

## Conformità GDPR (09/05/2026)
- [x] Creare pagina /privacy-policy con Privacy Policy completa GDPR (titolare, dati raccolti, finalità, diritti utente, cessione a terzi)
- [x] Creare pagina /cookie-policy con Cookie Policy completa (tipologie cookie, durata, gestione consenso)
- [x] Implementare banner cookie consent al primo accesso con pulsanti Accetta/Rifiuta/Personalizza
- [x] Aggiungere link Privacy Policy e Cookie Policy nel footer di tutte le pagine
- [x] Aggiornare modal SbloccaReferto: link cliccabile alla Privacy Policy accanto al checkbox consenso

## Fix GDPR UX (09/05/2026)
- [x] Fix link Privacy nel modal SbloccaReferto: aprire informativa in drawer/overlay senza chiudere il modal e perdere il flusso
- [x] Cookie Policy: allineare ai cookie realmente usati (rimosso _analytics placeholder, documentati solo cookie tecnici e localStorage)

## Refactoring UdiTest + White-label (21/05/2026)

- [x] Rinominare app da "UdiTest" a "UdiTest" in tutti i file
- [x] Aggiornare VITE_APP_TITLE a "UdiTest"
- [x] Aggiornare manifest.json con nuovo nome
- [x] Aggiornare Privacy Policy e Cookie Policy con nuovo nome UdiTest
- [x] Implementare login admin indipendente (email + password bcrypt, senza Manus OAuth)
- [x] Credenziali admin iniziali: ordini@acusticadimaio.it / Uditest@26 (hashate nel DB)
- [x] Pagina /admin/login con form email+password
- [x] Proteggere /admin/leads con il nuovo sistema di autenticazione admin
- [x] Aggiungere tasto "Admin" discreto nel footer dell'app (piccolo, non invadente)
- [x] Creare pannello configurazione /admin/config: logo, nome app, WhatsApp, email, colore primario
- [x] Salvare configurazione nel DB (tabella app_config)
- [x] Applicare configurazione dinamicamente in tutta l'app (logo, nome, contatti)
- [x] Implementare Service Worker per modalità offline
- [x] Test vocale e tonale funzionanti senza internet
- [x] Sincronizzazione dati quando torna la connessione
