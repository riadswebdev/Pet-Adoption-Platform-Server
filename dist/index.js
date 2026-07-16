"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const petRoutes_1 = __importDefault(require("./routes/petRoutes"));
const petController_1 = require("./controllers/petController");
const authMiddleware_1 = require("./middleware/authMiddleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.app = app;
const port = Number(process.env["PORT"] || 8000);
app.use(
  (0, cors_1.default)({
    origin:
      process.env["CLIENT_URL"] ||
      "https://pet-adoption-platform-drab.vercel.app",
    credentials: true,
  }),
);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/api/pets", petRoutes_1.default);
app.get("/api/my-pets", authMiddleware_1.requireAuth, petController_1.getMyPets);
app.get("/api/health", (_req, res) => {
    res
        .status(200)
        .json({ status: "OK", message: "Pet Adoption API is running" });
});
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
if (!process.env["VERCEL"]) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}
const handler = (0, serverless_http_1.default)(app);
exports.handler = handler;
exports.default = handler;
module.exports = handler;
//# sourceMappingURL=index.js.map