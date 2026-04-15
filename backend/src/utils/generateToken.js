import jwt from "jsonwebtoken";

const generateToken = (user) => {
	return jwt.sign(
		{
			user_id: user.user_id,
			email: user.email,
			role: user.role,
			unit_id: user.unit_id || null,
			barangay_id: user.barangay_id || null,
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
	);
};

export default generateToken;
