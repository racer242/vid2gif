import express from "express";
import dictionary from "../configuration/dictionary.js";
import settings from "../configuration/settings.js";
import { sendGetRequest } from "../helpers/httpTools.js";
import { protectUrl } from "../helpers/urlTools.js";
import { getConfiguration } from "../configuration/Configuration.js";
import { getMatches } from "../helpers/stringTools.js";

var router = express.Router();

/* GET home page. */
router.get("/*", async (req, res, next) => {
  // if (req.headers.token!=settings.secretTokens.dashboard) {
  //   console.log("Authorization failed:",reqPath);
  //   res.status(403)
  //   res.end();
  //   return;
  // }

  res.json(req.app.get("apiState"));
});

export default router;
