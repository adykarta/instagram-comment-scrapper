const AppError = require("../utils/appError");
const instagramService = require('../services/instagramService');
exports.scrapComments = async (req, res, next) => {
  try {
    const { username, password, post } = req.body;

    if (!username || !password || !post) {
      return next(
        new AppError(404, "fail", "Please provide username or password or post"),
        req,
        res,
        next,
      );
    }
    const data = await instagramService.main(username, password, post);

    res.status(200).json({
      status: "success",
      data
    });
  } catch (err) {
    next(err);
  }
};