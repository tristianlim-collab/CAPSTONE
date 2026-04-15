import http from "http";
import dotenv from "dotenv";
import app from "./src/app.js";
import { initSocket } from "./socket.js";

dotenv.config();

const port = Number(process.env.PORT || 5000);
const server = http.createServer(app);

initSocket(server);

server.listen(port, () => {
	// eslint-disable-next-line no-console
	console.log(`GAOIRS backend running on http://localhost:${port}`);
});
