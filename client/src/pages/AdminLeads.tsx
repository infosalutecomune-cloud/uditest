// ══════════════════════════════════════════════════════════
// AdminLeads — Pannello admin per visualizzare i lead
// Usa il login admin indipendente (non Manus OAuth)
// ══════════════════════════════════════════════════════════
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Users, Mic, Music, TrendingUp, Share2, LogOut, Settings } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────
function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function yn(v: boolean | null) {
  return v ? (
    <Badge className="bg-green-100 text-green-800 border-green-200">✅ Sì</Badge>
  ) : (
    <Badge variant="outline" className="text-gray-500">No</Badge>
  );
}

type LeadRow = {
  id: number;
  nome: string | null;
  cognome: string | null;
  email: string;
  cellulare: string | null;
  citta: string | null;
  provincia: string | null;
  consensoPrivacy: boolean;
  consensoMarketing: boolean;
  consensoCessione: boolean;
  tipoTest: string | null;
  risultatoSintetico: string | null;
  ipAddress: string | null;
  createdAt: Date | string | null;
};

// Mappa tipo test in etichetta leggibile
function labelTipoTest(t: string | null): string {
  if (!t) return "";
  if (t === "vocale-silenzio") return "Test Vocale (silenzio)";
  if (t === "vocale-rumore") return "Test Vocale (rumore)";
  if (t === "tonale") return "Test Tonale";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function exportCSV(items: LeadRow[]) {
  // Intestazioni italiane chiare
  const headers = [
    "N.",
    "Data e Ora",
    "Nome",
    "Cognome",
    "Email",
    "Cellulare",
    "Città",
    "Provincia",
    "Tipo Test",
    "Valutazione Finale",
    "Consenso Privacy",
    "Consenso Marketing",
    "Cessione a Partner",
  ];
  const rows = items.map(l => [
    l.id,
    formatDate(l.createdAt),
    l.nome ?? "",
    l.cognome ?? "",
    l.email,
    l.cellulare ?? "",
    l.citta ?? "",
    l.provincia ?? "",
    labelTipoTest(l.tipoTest),
    l.risultatoSintetico ?? "",
    l.consensoPrivacy ? "Sì" : "No",
    l.consensoMarketing ? "Sì" : "No",
    l.consensoCessione ? "Sì" : "No",
  ]);
  // Usa TAB come separatore per compatibilità Excel (nessun problema con virgole/punti)
  const sep = "\t";
  const csv = [headers, ...rows]
    .map(row => row.map(cell => String(cell).replace(/\t/g, " ")).join(sep))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/tab-separated-values;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lead-uditest-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Componente principale ─────────────────────────────────
export default function AdminLeads() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [tipoTest, setTipoTest] = useState<string | undefined>(undefined);
  const [filtroMarketing, setFiltroMarketing] = useState<boolean | undefined>(undefined);
  const [filtroCessione, setFiltroCessione] = useState<boolean | undefined>(undefined);

  // Verifica sessione admin
  const { data: adminUser, isLoading: authLoading } = trpc.adminAuth.me.useQuery();

  // Query leads (solo se autenticato)
  const { data, isLoading, refetch } = trpc.admin.getLeads.useQuery(
    {
      search: search || undefined,
      tipoTest: tipoTest || undefined,
      consensoMarketing: filtroMarketing,
      consensoCessione: filtroCessione,
      limit: 500,
    },
    { enabled: !!adminUser }
  );

  // Query stats
  const { data: stats } = trpc.admin.getStats.useQuery(
    undefined,
    { enabled: !!adminUser }
  );

  // Logout
  const logoutMutation = trpc.adminAuth.logout.useMutation({
    onSuccess: () => {
      utils.adminAuth.me.invalidate();
      navigate("/admin/login");
    },
  });

  // ── Stato: caricamento auth ──────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Stato: non autenticato → redirect login ──────────────
  if (!adminUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-2xl font-bold text-gray-800">Area riservata</h1>
        <p className="text-gray-500">Devi accedere per visualizzare questa pagina.</p>
        <Button onClick={() => navigate("/admin/login")} className="bg-blue-600 hover:bg-blue-700">
          Accedi come Admin
        </Button>
      </div>
    );
  }

  const items: LeadRow[] = (data?.items ?? []) as LeadRow[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/">
            <span className="text-blue-600 hover:underline text-sm cursor-pointer">← App</span>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl font-bold text-gray-800">Pannello Lead — UdiTest</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:block">
            {adminUser.nome || adminUser.email}
          </span>
          <Link href="/admin/config">
            <Button variant="outline" size="sm" className="gap-1">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configurazione</span>
            </Button>
          </Link>
          <Button
            onClick={() => exportCSV(items)}
            disabled={items.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            size="sm"
          >
            <Download className="w-4 h-4" />
            CSV ({items.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Esci</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* Statistiche */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Totale lead", value: stats.total, icon: <Users className="w-4 h-4" />, color: "text-blue-700" },
              { label: "Test Vocale", value: stats.vocale, icon: <Mic className="w-4 h-4" />, color: "text-indigo-700" },
              { label: "Test Tonale", value: stats.tonale, icon: <Music className="w-4 h-4" />, color: "text-teal-700" },
              { label: "Consenso marketing", value: stats.marketing, icon: <TrendingUp className="w-4 h-4" />, color: "text-orange-600",
                sub: stats.total > 0 ? `${Math.round(stats.marketing / stats.total * 100)}%` : "0%" },
              { label: "Cessione partner", value: stats.cessione, icon: <Share2 className="w-4 h-4" />, color: "text-purple-600",
                sub: stats.total > 0 ? `${Math.round(stats.cessione / stats.total * 100)}%` : "0%" },
            ].map(s => (
              <Card key={s.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
                    {s.icon} {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  {s.sub && <p className="text-xs text-gray-400 mt-1">{s.sub} del totale</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filtri */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Input
                placeholder="Cerca per nome, email, cellulare..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs"
              />
              <Select value={tipoTest ?? "tutti"} onValueChange={v => setTipoTest(v === "tutti" ? undefined : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Tipo test" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti i test</SelectItem>
                  <SelectItem value="vocale">Test Vocale</SelectItem>
                  <SelectItem value="tonale">Test Tonale</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtroMarketing === undefined ? "tutti" : filtroMarketing ? "si" : "no"}
                onValueChange={v => setFiltroMarketing(v === "tutti" ? undefined : v === "si")}
              >
                <SelectTrigger className="w-44"><SelectValue placeholder="Consenso marketing" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti</SelectItem>
                  <SelectItem value="si">✅ Marketing: Sì</SelectItem>
                  <SelectItem value="no">❌ Marketing: No</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filtroCessione === undefined ? "tutti" : filtroCessione ? "si" : "no"}
                onValueChange={v => setFiltroCessione(v === "tutti" ? undefined : v === "si")}
              >
                <SelectTrigger className="w-44"><SelectValue placeholder="Consenso cessione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tutti">Tutti</SelectItem>
                  <SelectItem value="si">✅ Cessione: Sì</SelectItem>
                  <SelectItem value="no">❌ Cessione: No</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => refetch()} size="sm">Aggiorna</Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabella */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">Nessun lead trovato</p>
                <p className="text-sm">I lead appariranno qui quando gli utenti completeranno il test.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 text-xs">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead className="min-w-[130px]">Data e Ora</TableHead>
                      <TableHead className="min-w-[140px]">Nome e Cognome</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Cellulare</TableHead>
                      <TableHead className="min-w-[110px]">Città</TableHead>
                      <TableHead className="w-16 text-center">Prov.</TableHead>
                      <TableHead className="min-w-[160px]">Tipo Test</TableHead>
                      <TableHead className="min-w-[180px]">Valutazione Finale</TableHead>
                      <TableHead className="w-20 text-center">Marketing</TableHead>
                      <TableHead className="w-20 text-center">Cessione</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(l => (
                      <TableRow key={l.id} className="hover:bg-blue-50/30 text-sm">
                        <TableCell className="text-gray-400 text-xs text-center">{l.id}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap text-gray-600">{formatDate(l.createdAt)}</TableCell>
                        <TableCell className="font-semibold whitespace-nowrap">
                          {[l.nome, l.cognome].filter(Boolean).join(" ") || <span className="text-gray-400 font-normal">—</span>}
                        </TableCell>
                        <TableCell className="text-blue-700 text-sm">{l.email}</TableCell>
                        <TableCell className="whitespace-nowrap text-gray-700">{l.cellulare || <span className="text-gray-400">—</span>}</TableCell>
                        <TableCell className="whitespace-nowrap text-gray-700">{l.citta || <span className="text-gray-400">—</span>}</TableCell>
                        <TableCell className="text-center text-xs font-semibold text-gray-600">{l.provincia || <span className="text-gray-400">—</span>}</TableCell>
                        <TableCell>
                          {l.tipoTest ? (
                            <Badge
                              variant="outline"
                              className={
                                l.tipoTest === 'tonale'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }
                            >
                              {labelTipoTest(l.tipoTest)}
                            </Badge>
                          ) : <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell>
                          {l.risultatoSintetico ? (
                            <span className={
                              l.risultatoSintetico.toLowerCase().includes('norma') || l.risultatoSintetico.toLowerCase().includes('normale')
                                ? 'text-green-700 font-semibold'
                                : l.risultatoSintetico.toLowerCase().includes('lieve')
                                ? 'text-yellow-700 font-semibold'
                                : l.risultatoSintetico.toLowerCase().includes('moderata') || l.risultatoSintetico.toLowerCase().includes('moderato')
                                ? 'text-orange-600 font-semibold'
                                : 'text-red-600 font-bold'
                            }>
                              {l.risultatoSintetico}
                            </span>
                          ) : <span className="text-gray-400">—</span>}
                        </TableCell>
                        <TableCell className="text-center">{yn(l.consensoMarketing)}</TableCell>
                        <TableCell className="text-center">{yn(l.consensoCessione)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} UdiTest — Acustica Di Maio
        </p>
      </div>
    </div>
  );
}
