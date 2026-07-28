import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import exchangeRouter from "./exchange";
import adminExchangeRouter from "./admin_exchange";
import adminClientsRouter from "./admin_clients";
import adminReportsRouter from "./admin_reports";
import adminBalancesRouter from "./admin_balances";
import { adminAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(exchangeRouter);

// Proteger todas as rotas administrativas sob o prefixo /admin
router.use("/admin", adminAuth);

router.use(ordersRouter);
router.use(adminExchangeRouter);
router.use(adminClientsRouter);
router.use(adminReportsRouter);
router.use(adminBalancesRouter);

export default router;

