import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";

const router: IRouter = Router();

// Armazena timestamps de acessos em memória (limpeza automática de entradas > 30 dias)
const accessLog: number[] = [];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Limpar entradas mais antigas que 30 dias (executado periodicamente)
function pruneOldEntries() {
  const cutoff = Date.now() - THIRTY_DAYS_MS;
  let i = 0;
  while (i < accessLog.length && accessLog[i] < cutoff) i++;
  if (i > 0) accessLog.splice(0, i);
}

// Middleware exportado para registar acessos ao site (todas as rotas públicas)
export function trackSiteAccess(req: Request, _res: Response, next: NextFunction): void {
  // Ignorar rotas admin e health
  if (!req.path.startsWith("/api/admin") && !req.path.startsWith("/api/health")) {
    const now = Date.now();
    accessLog.push(now);
    // Limpar entradas antigas de tempos em tempos
    if (accessLog.length % 500 === 0) pruneOldEntries();
  }
  next();
}

// GET /api/admin/site-visits?period=6h|1d|7d|30d
router.get("/admin/site-visits", (req, res): void => {
  const period = (req.query.period as string) ?? "1d";

  const periodMap: Record<string, number> = {
    "6h":  6 * 60 * 60 * 1000,
    "1d":  24 * 60 * 60 * 1000,
    "7d":  7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const durationMs = periodMap[period] ?? periodMap["1d"];
  const cutoff = Date.now() - durationMs;

  pruneOldEntries();
  const count = accessLog.filter(ts => ts >= cutoff).length;

  res.json({ count, period, total: accessLog.length });
});

export default router;
