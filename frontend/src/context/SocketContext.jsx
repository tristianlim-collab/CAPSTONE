import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

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

		const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
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
			}
			if (user?.role === "REPORTER") {
				const userId = user?.user_id || user?.id;
				if (userId) {
					socket.emit("join_reporter", userId);
				}
			}
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

	const on = (eventName, callback) => {
		if (!socketRef.current) {
			return () => {};
		}
		socketRef.current.on(eventName, callback);
		return () => socketRef.current?.off(eventName, callback);
	};

	const emit = (eventName, payload) => {
		socketRef.current?.emit(eventName, payload);
	};

	const value = useMemo(
		() => ({
			socket: socketRef.current,
			connected,
			on,
			emit,
		}),
		[connected]
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
