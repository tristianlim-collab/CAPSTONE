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

		const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
		const defaultUrl = isLocal ? "http://localhost:5000" : "https://gaoirs.onrender.com";
		const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || defaultUrl;
		const socket = io(socketUrl, {
			transports: ["polling", "websocket"],
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
		});

		socketRef.current = socket;

		socket.on("connect", () => {
			setConnected(true);
			console.log("[Socket] Connected:", socket.id);

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
	}, [isAuthenticated]);

	// Join rooms whenever socket connects or user state is populated/updated
	useEffect(() => {
		if (!connected || !socketRef.current || !user) return;

		const role = user?.role?.toUpperCase();
		if (role === "ADMIN") {
			console.log("[Socket] Emitting join_admin");
			socketRef.current.emit("join_admin");
		} else if (role === "RESPONSE_UNIT") {
			socketRef.current.emit("join_response");
			if (user?.unit_id) {
				socketRef.current.emit("join_unit", user.unit_id);
			}
			if (user?.unit?.barangay?.municipality) {
				socketRef.current.emit("join_municipality", user.unit.barangay.municipality);
			}
		} else if (role === "REPORTER") {
			const userId = user?.user_id || user?.id;
			if (userId) {
				socketRef.current.emit("join_reporter", userId);
			}
		}
	}, [connected, user]);

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
