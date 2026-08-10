import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.post("/admin/login", (req, res): void => {
  const { password } = req.body as { password?: string };
  const adminSecret = process.env.ADMIN_PASSWORD || "kwanza2025admin";

  if (!password || password !== adminSecret) {
    res.status(401).json({ error: "Senha incorrecta", message: "Credenciais de administrador inválidas" });
    return;
  }

  res.json({ ok: true, token: adminSecret });
});

export default router;
