import "dotenv/config";
import "./db";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import cors from 'cors';
import { serveStatic } from "./static";


const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

(async () => {
  await registerRoutes(httpServer, app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  }
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.platform === 'win32' ? 'localhost' : '0.0.0.0';
  
  httpServer.listen(port, host, () => {
    console.log(`✅ Server running on http://${host}:${port}`);
  });
})();
