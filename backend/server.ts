import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import session from "express-session";
import MongoStore from "connect-mongo";
import AuthRouter from "./routes/AuthRoutes.js";
import ThumbnailRouter from "./routes/ThumbnailRoutes.js";
import UserRouter from "./routes/UserRoutes.js";

declare module "express-session" {
  interface SessionData {
    isLoggedIn: boolean;
    userId: string;
  }
}

await connectDB();

const app = express();

/** ===== CORS (IMPORTANT) ===== */
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:3000",
  "https://thumbclick.vercel.app",
];

// If you also use preview deployments, you can optionally allow *.vercel.app
// (better is to add your exact preview URLs)
// const allowVercelWildcard = (origin: string) => origin.endsWith(".vercel.app");

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // allow non-browser clients (Postman, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// ✅ this is what fixes "Response Headers (0)" / preflight failures
app.options("*", cors(corsOptions));

/** ===== Trust proxy (Vercel / reverse proxies) ===== */
app.set("trust proxy", 1);

/** ===== Body parser ===== */
app.use(express.json());

/** ===== Session ===== */
const isProd = process.env.NODE_ENV === "production";

app.use(
  session({
    name: "sid", // optional cookie name (you can remove this line)
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI as string,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,

      // ✅ Cross-site cookie requirements for Vercel FE -> Vercel/other BE:
      // If frontend and backend are different origins, you MUST use:
      // SameSite=None + Secure=true
      sameSite: isProd ? "none" : "lax",
      secure: isProd, // in production must be true (HTTPS)
      path: "/",
    },
  })
);

/** ===== Health route ===== */
app.get("/", (req: Request, res: Response) => {
  res.send("Server is Live!");
});

/** ===== Routes ===== */
app.use("/api/auth", AuthRouter);
app.use("/api/thumbnail", ThumbnailRouter);
app.use("/api/user", UserRouter);

/** ===== Start ===== */
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
