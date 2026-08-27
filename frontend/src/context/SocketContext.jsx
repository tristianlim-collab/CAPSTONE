import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { requestNotificationPermission, setupSocketNotifications } from "../utils/pushNotifications";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
	const { user, isAuthenticated } = useAuth();
	const socketRef = useRef(null);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		if (!isAuthenticated) {
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
			}
			setConnected(false);
			return;
		}

		const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || "http://localhost:5000";
		const socket = io(socketUrl, {
			transports: ["websocket", "polling"],
		});

		socketRef.current = socket;

		socket.on("connect", () => {
			setConnected(true);
			console.log("[Socket] Connected:", socket.id);

			if (user?.role === "ADMIN") {
				socket.emit("join_admin");
			}
			if (user?.role === "RESPONSE_UNIT") {
				// Join the general response room so we get all broadcasts
				socket.emit("join_response");
				// Also join unit-specific room if we have a unit_id
				if (user?.unit_id) {
					socket.emit("join_unit", user.unit_id);
				}
				// Join municipality room for city-scoped alerts
				if (user?.unit?.barangay?.municipality) {
					socket.emit("join_municipality", user.unit.barangay.municipality);
				}
			}
			if (user?.role === "REPORTER") {
				const userId = user?.user_id || user?.id;
				if (userId) {
					socket.emit("join_reporter", userId);
				}
			}

			// Request browser notification permission and set up listeners
			requestNotificationPermission().then(() => {
				setupSocketNotifications(socket);
			});
		});

		socket.on("disconnect", () => {
			setConnected(false);
			console.log("[Socket] Disconnected");
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
		};
	}, [isAuthenticated, user]);

	const on = useCallback((eventName, callback) => {
		if (!socketRef.current) {
			return () => { };
		}
		socketRef.current.on(eventName, callback);
		return () => socketRef.current?.off(eventName, callback);
	}, [connected]);

	const emit = useCallback((eventName, payload) => {
		socketRef.current?.emit(eventName, payload);
	}, [connected]);

	const value = useMemo(
		() => ({
			socket: socketRef.current,
			connected,
			on,
			emit,
		}),
		[connected, on, emit]
	);

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocketContext = () => {
	const context = useContext(SocketContext);
	if (!context) {
		throw new Error("useSocketContext must be used within SocketProvider");
	}
	return context;
};
