export const success = ({ data = null, message = "Success" } = {}) => ({
	success: true,
	data,
	message,
});

export const error = ({ error: errorData = null, message = "Request failed" } = {}) => ({
	success: false,
	error: errorData,
	message,
});

export default { success, error };
