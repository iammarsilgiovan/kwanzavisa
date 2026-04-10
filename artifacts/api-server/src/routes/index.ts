import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ordersRouter from "./orders";
import exchangeRouter from "./exchange";
import adminExchangeRouter from "./admin_exchange";
import adminClientsRouter from "./admin_clients";
import adminReportsRouter from "./admin_reports";
import adminBalancesRouter from "./admin_balances";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ordersRouter);
router.use(exchangeRouter);
router.use(adminExchangeRouter);
router.use(adminClientsRouter);
router.use(adminReportsRouter);
router.use(adminBalancesRouter);

export default router;
