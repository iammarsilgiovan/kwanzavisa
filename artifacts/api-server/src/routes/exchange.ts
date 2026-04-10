import { Router, type IRouter } from "express";
import { GetExchangeRateQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const USD_BASE_RATE = 920;
const EUR_BASE_RATE = 1010;
const MARGIN_PERCENT = 3.5;

function applyMargin(rate: number): number {
  return Math.round(rate * (1 + MARGIN_PERCENT / 100));
}

router.get("/exchange/rate", async (req, res): Promise<void> => {
  const params = GetExchangeRateQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }

  const { currency, amount = 1 } = params.data;

  let baseRate: number;
  if (currency === "USD") {
    baseRate = USD_BASE_RATE;
  } else {
    baseRate = EUR_BASE_RATE;
  }

  const ratePerUnit = applyMargin(baseRate);
  const amountKwanza = Math.round(amount * ratePerUnit);

  res.json({
    currency,
    ratePerUnit,
    amount,
    amountKwanza,
    updatedAt: new Date().toISOString(),
  });
});

export default router;
