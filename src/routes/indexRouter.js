import express from "express";
import dictionary from "../configuration/dictionary.js";

var router = express.Router();

router.get("/", function (req, res, next) {
  res.send(dictionary.responces.index);
});

export default router;
