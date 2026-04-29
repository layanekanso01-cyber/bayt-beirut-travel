type UserLike = {
  id: string;
  username: string;
  name?: string | null;
  email?: string | null;
};

type BookingLike = {
  id?: string;
  customerName?: string;
  customer_name?: string;
};

function userKey(user: UserLike) {
  return user.id || user.username;
}

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

export function scopedStorageKey(user: UserLike, key: string) {
  return `${key}:${userKey(user)}`;
}

export function readUserBookingIds(user: UserLike) {
  try {
    const value = localStorage.getItem(scopedStorageKey(user, "bookingIds"));
    const parsed = value ? JSON.parse(value) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set<string>();
  }
}

export function rememberUserBooking(user: UserLike | null | undefined, bookingId: string) {
  if (!user || !bookingId) return;

  const bookingIds = readUserBookingIds(user);
  bookingIds.add(String(bookingId));
  localStorage.setItem(scopedStorageKey(user, "bookingIds"), JSON.stringify(Array.from(bookingIds)));
}

export function bookingBelongsToUser(booking: BookingLike, user: UserLike | null | undefined, knownBookingIds?: Set<string>) {
  if (!user) return false;

  const bookingId = booking.id ? String(booking.id) : "";
  const bookingIds = knownBookingIds ?? readUserBookingIds(user);
  if (bookingId && bookingIds.has(bookingId)) return true;

  const customerName = normalize(booking.customerName ?? booking.customer_name);
  if (!customerName) return false;

  const userNames = [user.name, user.username, user.email].map(normalize).filter(Boolean);
  return userNames.includes(customerName);
}
