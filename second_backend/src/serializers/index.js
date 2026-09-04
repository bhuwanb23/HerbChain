/**
 * Serializers — ports of the model to_dict() methods in backend/server/models.
 *
 * Prisma rows are plain objects with JS Date instances; these mappers return
 * the exact JSON shape the Flask API produced.
 */

/** Flask datetime.isoformat() on naive-UTC datetimes: no trailing Z. */
function iso(d) {
  if (!d) return null;
  return d.toISOString().replace("Z", "");
}

function serializeUser(user, { includeEmail = true } = {}) {
  if (!user) return null;
  const out = {
    user_id: user.user_id,
    role: user.role,
    name: user.name,
    phone: user.phone,
    location: user.location,
    gps_lat: user.gps_lat,
    gps_lng: user.gps_lng,
    language_pref: user.language_pref,
    is_active: user.is_active,
    kyc_verified: user.kyc_verified,
    created_at: iso(user.created_at),
    updated_at: iso(user.updated_at),
  };
  if (includeEmail) out.email = user.email;
  return out;
}

module.exports = { iso, serializeUser };