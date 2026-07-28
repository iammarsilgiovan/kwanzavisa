import { Request, Response, NextFunction } from "express";

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Não autorizado", message: "Token de autorização ausente" });
    return;
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;

  if (token !== "kwanza2025admin") {
    res.status(401).json({ error: "Não autorizado", message: "Token de autorização inválido" });
    return;
  }

  next();
}
