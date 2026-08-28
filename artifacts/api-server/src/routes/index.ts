import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import exchangeRouter from "./exchange";
import adminAuthRouter from "./admin_auth";
import adminExchangeRouter from "./admin_exchange";
import adminClientsRouter from "./admin_clients";
import adminReportsRouter from "./admin_reports";
import adminBalancesRouter from "./admin_balances";
import adminAnalyticsRouter from "./admin_analytics";
import { adminAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(exchangeRouter);
// Rotas de autenticação admin (login step 1 e verify step 2) sem middleware de auth
router.use(adminAuthRouter);

// Proteger todas as rotas administrativas sob o prefixo /admin
router.use("/admin", adminAuth);

router.use(ordersRouter);
router.use(adminExchangeRouter);
router.use(adminClientsRouter);
router.use(adminReportsRouter);
router.use(adminBalancesRouter);
router.use(adminAnalyticsRouter);

export default router;

