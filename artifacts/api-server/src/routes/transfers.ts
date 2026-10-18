import { Router, type IRouter } from "express";
import { SubmitTransferBody } from "@workspace/api-zod";

const router: IRouter = Router();
const transferRestrictionMessage =
  "Withdrawals and transfers are suspended pending probate authorization";

router.post("/transfers", (req, res): void => {
  const parsed = SubmitTransferBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Transfer details are invalid." });
    return;
  }

  // This prototype endpoint intentionally performs no transfer operation and
  // never changes balances. The restriction is enforced server-side regardless
  // of how a client submits the request.
  res.status(403).json({ message: transferRestrictionMessage });
});

export default router;
