import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
	io = new Server(server, {
		cors: {
			origin: (origin, callback) => {
				// Allow all origins (localhost, vercel.app, mobile apps) for seamless real-time sockets
				return callback(null, true);
			},
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`[Socket] Client connected: ${socket.id}`);

		socket.on("join_admin", () => {
			socket.join("admin");
			console.log(`[Socket] ${socket.id} joined admin room`);
		});

		socket.on("join_unit", (unitId) => {
			if (unitId) {
				socket.join(`unit-${unitId}`);
				console.log(`[Socket] ${socket.id} joined unit-${unitId}`);
			}
		});

		socket.on("join_reporter", (userId) => {
			if (userId) {
				socket.join(`reporter-${userId}`);
				console.log(`[Socket] ${socket.id} joined reporter-${userId}`);
			}
		});

		// General response room — all response-unit users join this
		socket.on("join_response", () => {
			socket.join("response");
			console.log(`[Socket] ${socket.id} joined response room`);
		});

		socket.on("join_municipality", (municipality) => {
			if (municipality) {
				const room = `municipality-${municipality.toLowerCase()}`;
				socket.join(room);
				console.log(`[Socket] ${socket.id} joined ${room}`);
			}
		});

		socket.on("disconnect", (reason) => {
			console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
		});
	});

	return io;
};

export const getIO = () => {
	if (!io) {
		throw new Error("Socket.io not initialized");
	}
	return io;
};

export const socketEvents = {
	newIncident: (payload) => getIO().to("admin").emit("new_incident", payload),
	incidentAssigned: (unitId, payload) => getIO().to(`unit-${unitId}`).emit("incident_assigned", payload),
	incidentUpdated: (reporterId, payload) => {
		getIO().to("admin").emit("incident_updated", payload);
		getIO().to("response").emit("incident_updated", payload);
		if (reporterId) {
			getIO().to(`reporter-${reporterId}`).emit("incident_updated", payload);
		}
	},
	alertReceived: (unitId, payload) => getIO().to(`unit-${unitId}`).emit("alert_received", payload),
	statusChanged: (payload) => getIO().to("admin").emit("status_changed", payload),
	dashboardRefresh: (payload = { refresh: true }) => getIO().to("admin").emit("dashboard_refresh", payload),
};
