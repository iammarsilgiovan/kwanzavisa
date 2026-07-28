import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Aplicar Helmet para definir cabeçalhos de segurança HTTP recomendados
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'", "https://*"],
      },
    },
  })
);

// Configuração segura de CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" && allowedOrigins.length > 0 ? allowedOrigins : true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Limitação de taxa de requisição para proteger contra abusos
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: 200, // Limita cada IP a 200 requisições por janela
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Muitas requisições",
    message: "Limite de requisições excedido. Tente novamente mais tarde.",
  },
});

app.use("/api", apiLimiter);
app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const publicDir = path.resolve(__dirname, "../../kwanzavisa/dist/public");

  app.use(express.static(publicDir));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

export default app;

