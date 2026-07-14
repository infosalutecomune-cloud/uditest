// UdiTest — Pannello configurazione white-label
// Accessibile solo dopo login admin a /admin/config

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Settings, ArrowLeft, Save, Eye, EyeOff, RefreshCw } from "lucide-react";

// Campi configurabili con etichette e descrizioni
const CONFIG_FIELDS = [
  {
    section: "Identità",
    fields: [
      { key: "app_nome", label: "Nome app", placeholder: "UdiTest", description: "Mostrato nell'header e nei PDF" },
      { key: "app_slogan", label: "Slogan", placeholder: "Sentire bene è vivere meglio.", description: "Testo sotto il logo nella home" },
      { key: "logo_url", label: "URL Logo", placeholder: "https://...", description: "URL dell'immagine del logo (usa manus-storage o CDN)" },
      { key: "colore_primario", label: "Colore primario (hex)", placeholder: "#1E73BE", description: "Colore principale dell'app (es. #1E73BE)" },
      { key: "colore_secondario", label: "Colore secondario (hex)", placeholder: "#0D9488", description: "Colore secondario (es. #0D9488)" },
    ],
  },
  {
    section: "Contatti",
    fields: [
      { key: "whatsapp_numero", label: "Numero WhatsApp", placeholder: "393341990307", description: "Numero internazionale senza + (es. 393341990307)" },
      { key: "whatsapp_messaggio", label: "Messaggio WhatsApp precompilato", placeholder: "Ciao, vorrei prenotare una visita...", description: "Testo pre-compilato quando l'utente clicca WhatsApp" },
      { key: "prenota_url", label: "URL prenotazione", placeholder: "https://www.acusticadimaio.it/contatta-e-prenota/", description: "Link al form di prenotazione" },
      { key: "email_contatto", label: "Email di contatto", placeholder: "info@acusticadimaio.it", description: "Email mostrata nei PDF e nelle comunicazioni" },
    ],
  },
  {
    section: "Azienda",
    fields: [
      { key: "azienda_nome", label: "Nome azienda", placeholder: "Acustica Di Maio", description: "Mostrato nel footer e nei PDF" },
      { key: "azienda_indirizzo", label: "Indirizzo", placeholder: "Torre Annunziata (NA)", description: "Indirizzo del centro" },
      { key: "azienda_piva", label: "Partita IVA", placeholder: "09539631219", description: "P.IVA per i documenti legali" },
      { key: "azienda_sito", label: "Sito web", placeholder: "https://www.acusticadimaio.it", description: "URL del sito web aziendale" },
    ],
  },
  {
    section: "Privacy & GDPR",
    fields: [
      { key: "privacy_titolare", label: "Titolare del trattamento", placeholder: "Acustica Di Maio", description: "Nome del titolare per la privacy policy" },
      { key: "privacy_email_dpo", label: "Email DPO/Privacy", placeholder: "privacy@acusticadimaio.it", description: "Email per richieste GDPR" },
      { key: "consenso_marketing_testo", label: "Testo consenso marketing", placeholder: "Acconsento ad essere contattato...", description: "Testo del checkbox marketing nel form sblocca referto" },
      { key: "consenso_cessione_testo", label: "Testo consenso cessione", placeholder: "Acconsento alla cessione dei miei dati...", description: "Testo del checkbox cessione a partner" },
    ],
  },
];

export default function AdminConfig() {
  const [, navigate] = useLocation();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Verifica auth admin
  const { data: adminMe, isLoading: authLoading } = trpc.adminAuth.me.useQuery();
  const { data: configData, isLoading: configLoading, refetch } = trpc.admin.getConfig.useQuery(undefined, {
    enabled: !!adminMe,
  });
  const saveConfig = trpc.admin.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurazione salvata con successo");
      setHasChanges(false);
      refetch();
    },
    onError: (err) => {
      toast.error("Errore nel salvataggio: " + err.message);
    },
  });

  useEffect(() => {
    if (!authLoading && !adminMe) {
      navigate("/admin/login");
    }
  }, [adminMe, authLoading, navigate]);

  useEffect(() => {
    if (configData) {
      setConfig(configData);
    }
  }, [configData]);

  const handleChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveConfig.mutate(config);
  };

  const handleReset = () => {
    if (configData) {
      setConfig(configData);
      setHasChanges(false);
    }
  };

  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Caricamento configurazione...</p>
        </div>
      </div>
    );
  }

  if (!adminMe) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/leads")}
              className="text-gray-600"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Leads
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h1 className="font-semibold text-gray-900">Configurazione App</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-gray-600"
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPreview ? "Nascondi valori" : "Mostra valori"}
            </Button>
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-gray-600"
              >
                Annulla modifiche
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saveConfig.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saveConfig.isPending ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Salva modifiche
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Banner info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Pannello White-Label:</strong> Modifica qui logo, nome, contatti e testi dell'app senza toccare il codice.
            Le modifiche sono attive immediatamente dopo il salvataggio.
          </p>
        </div>

        <Tabs defaultValue="Identità">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
            {CONFIG_FIELDS.map(section => (
              <TabsTrigger key={section.section} value={section.section}>
                {section.section}
              </TabsTrigger>
            ))}
          </TabsList>

          {CONFIG_FIELDS.map(section => (
            <TabsContent key={section.section} value={section.section}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{section.section}</CardTitle>
                  <CardDescription>
                    Configura i parametri relativi a {section.section.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {section.fields.map(field => (
                    <div key={field.key} className="space-y-1.5">
                      <Label htmlFor={field.key} className="text-sm font-medium text-gray-700">
                        {field.label}
                      </Label>
                      <Input
                        id={field.key}
                        type={!showPreview && field.key.includes("password") ? "password" : "text"}
                        placeholder={field.placeholder}
                        value={config[field.key] ?? ""}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">{field.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Sezione credenziali admin */}
        <Card className="mt-6 border-orange-200">
          <CardHeader>
            <CardTitle className="text-base text-orange-700">Credenziali Admin</CardTitle>
            <CardDescription>
              Per cambiare email o password di accesso al pannello admin, contatta il supporto tecnico
              o usa il database direttamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
              <p><strong>Email attuale:</strong> {adminMe.email}</p>
              <p className="mt-1 text-xs text-orange-600">
                Per cambiare la password, esegui questo SQL nel pannello Database:
              </p>
              <code className="block mt-2 bg-white border border-orange-200 rounded p-2 text-xs font-mono text-gray-700 break-all">
                UPDATE admin_users SET passwordHash = '$2b$12$...' WHERE email = '{adminMe.email}';
              </code>
              <p className="mt-1 text-xs text-orange-600">
                (Genera l'hash con: <code>node -e "require('bcryptjs').hash('NUOVA_PASSWORD', 12).then(console.log)"</code>)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
