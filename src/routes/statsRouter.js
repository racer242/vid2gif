import express from "express";

var router = express.Router();

/* GET home page. */
router.get("/*", async (req, res, next) => {
  // if (req.headers.token!=settings.secretTokens.dashboard) {
  //   console.log("Authorization failed:",reqPath);
  //   res.status(403)
  //   res.end();
  //   return;
  // }

  res.json(req.app.get("appState"));
});

export default router;
