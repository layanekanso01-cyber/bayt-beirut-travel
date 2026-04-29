export type AdminBooking = {
  id: string;
  customerName: string;
  type: "Transport" | "POI";
  itemName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
  bookings: number;
};

type RawBooking = Record<string, unknown>;

function parseAmount(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function isCompletedStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized !== "cancelled" && normalized !== "failed";
}

export function normalizeTransportBooking(booking: RawBooking): AdminBooking {
  return {
    id: String(booking.id ?? ""),
    customerName: String(booking.customerName ?? booking.customer_name ?? "Guest"),
    type: "Transport",
    itemName: String(booking.carName ?? booking.car_name ?? "Transport booking"),
    totalPrice: parseAmount(booking.totalPrice ?? booking.total_price),
    status: String(booking.status ?? "pending"),
    createdAt: String(booking.createdAt ?? booking.created_at ?? new Date().toISOString()),
  };
}

export function normalizePOIBooking(booking: RawBooking): AdminBooking {
  return {
    id: String(booking.id ?? ""),
    customerName: String(booking.customerName ?? booking.customer_name ?? "Guest"),
    type: "POI",
    itemName: String(booking.poiName ?? booking.poi_name ?? "POI booking"),
    totalPrice: parseAmount(booking.totalPrice ?? booking.total_price),
    status: String(booking.status ?? "pending"),
    createdAt: String(booking.bookingDate ?? booking.booking_date ?? booking.visitDate ?? booking.visit_date ?? new Date().toISOString()),
  };
}

export function calculateTotalRevenue(bookings: AdminBooking[]) {
  return bookings
    .filter((booking) => isCompletedStatus(booking.status))
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
}

export function getMonthlyRevenue(bookings: AdminBooking[]): MonthlyRevenue[] {
  const grouped = new Map<string, MonthlyRevenue>();

  bookings.filter((booking) => isCompletedStatus(booking.status)).forEach((booking) => {
    const date = new Date(booking.createdAt);
    const month = Number.isNaN(date.getTime())
      ? "Unknown"
      : date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    const current = grouped.get(month) ?? { month, revenue: 0, bookings: 0 };
    current.revenue += booking.totalPrice;
    current.bookings += 1;
    grouped.set(month, current);
  });

  return Array.from(grouped.values());
}

export function getRecentTransactions(bookings: AdminBooking[], limit = 8) {
  return [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
