import { Router } from "express";
import * as bs from "../services/brawlstars.js";

const router = Router();

router.get("/rotation", async (req, res, next) => {
  try {
    const data = await bs.getEventRotation();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
