export function successResponse(data, pagination = null) {
  return Response.json({ success: true, data, pagination });
}

export function errorResponse(message, code = 500) {
  console.error(`[API Error] ${message}`);
  return Response.json({ success: false, message }, { status: code });
}

export function getPaginationParams(searchParams, defaultLimit = 20) {
  const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit')) || defaultLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
