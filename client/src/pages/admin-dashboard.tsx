import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle, CreditCard, DollarSign, Edit, LogOut, Plus, QrCode, ShieldCheck, Trash2, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AdminBooking,
  calculateTotalRevenue,
  getMonthlyRevenue,
  getRecentTransactions,
  normalizePOIBooking,
  normalizeTransportBooking,
} from "@/lib/admin-analytics";
import { useAuth } from "@/contexts/auth-context";
import { AdminTrip, AdminTripInput, useAdminTrips } from "@/hooks/use-admin-trips";
import { extractBookingIdFromQr } from "@/lib/booking-qr";
import { Html5QrcodeScanner } from "html5-qrcode";

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof DollarSign;
}) {
  return (
    <Card className="p-5 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function statusBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "accepted" || normalized === "paid" || normalized === "completed") {
    return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  }
  if (normalized === "pending") {
    return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  }
  if (normalized === "used") {
    return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  }
  if (normalized === "cancelled" || normalized === "failed") {
    return "bg-red-100 text-red-800 hover:bg-red-100";
  }
  return "";
}

function formatStatus(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "Pending review";
  if (normalized === "accepted") return "Accepted";
  if (normalized === "paid" || normalized === "completed") return "Paid";
  if (normalized === "used") return "Checked in";
  if (normalized === "cancelled") return "Cancelled";
  if (normalized === "failed") return "Failed";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdminDashboard() {
  const { user: admin, logout } = useAuth();
  const isAdmin = admin?.role === "admin";
  const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { trips, addTrip, updateTrip, deleteTrip } = useAdminTrips();
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [qrBookingId, setQrBookingId] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [tripForm, setTripForm] = useState<AdminTripInput>({
    title: "",
    destination: "",
    description: "",
    price: 0,
    availableDates: "",
    image: "",
    category: "",
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    async function loadBookings() {
      try {
        const [transportResponse, poiResponse] = await Promise.all([
          fetch("/api/transport/bookings"),
          fetch("/api/poi/bookings"),
        ]);

        const transportData = transportResponse.ok ? await transportResponse.json() : [];
        const poiData = poiResponse.ok ? await poiResponse.json() : [];

        setBookings([
          ...transportData.map(normalizeTransportBooking),
          ...poiData.map(normalizePOIBooking),
        ]);
      } catch (error) {
        console.error("Admin dashboard booking load failed:", error);
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      loadBookings();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isScannerOpen) return;

    const scannerId = "admin-booking-qr-scanner";
    const scanner = new Html5QrcodeScanner(
      scannerId,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
      },
      false
    );

    scannerRef.current = scanner;
    setScannerMessage("Camera scanner is starting. Allow camera permission if your browser asks.");

    scanner.render(
      (decodedText) => {
        const bookingId = extractBookingIdFromQr(decodedText);
        setQrBookingId(bookingId);
        setScannerMessage("QR code scanned. Checking booking now.");
        setIsScannerOpen(false);
      },
      () => {
        setScannerMessage("Point the camera at a Bayt Beirut Travel QR ticket.");
      }
    );

    return () => {
      scannerRef.current
        ?.clear()
        .catch(() => {
          setScannerMessage("Scanner closed.");
        });
      scannerRef.current = null;
    };
  }, [isScannerOpen]);

  function stopScanner() {
    setIsScannerOpen(false);
    setScannerMessage("Scanner stopped.");
  }

  async function acceptBooking(booking: AdminBooking) {
    const endpoint =
      booking.type === "Transport"
        ? `/api/transport/bookings/${booking.id}/status`
        : `/api/poi/bookings/${booking.id}/status`;

    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });

    if (!response.ok) {
      console.error("Booking accept failed:", await response.json().catch(() => ({})));
      return;
    }

    setBookings((currentBookings) =>
      currentBookings.map((currentBooking) =>
        currentBooking.id === booking.id && currentBooking.type === booking.type
          ? { ...currentBooking, status: "accepted" }
          : currentBooking
      )
    );
  }

  const totalRevenue = useMemo(() => calculateTotalRevenue(bookings), [bookings]);
  const monthlyRevenue = useMemo(() => getMonthlyRevenue(bookings), [bookings]);
  const recentTransactions = useMemo(() => getRecentTransactions(bookings), [bookings]);
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0;
  const verifiedBooking = useMemo(() => {
    const code = qrBookingId.trim().toLowerCase();
    if (!code) return undefined;
    return bookings.find((booking) => booking.id.toLowerCase().includes(code));
  }, [bookings, qrBookingId]);

  function resetTripForm() {
    setEditingTripId(null);
    setTripForm({
      title: "",
      destination: "",
      description: "",
      price: 0,
      availableDates: "",
      image: "",
      category: "",
    });
  }

  function handleTripSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!tripForm.title.trim() || !tripForm.destination.trim()) return;

    if (editingTripId) {
      updateTrip(editingTripId, tripForm);
    } else {
      addTrip(tripForm);
    }

    resetTripForm();
  }

  function startEditingTrip(trip: AdminTrip) {
    setEditingTripId(trip.id);
    setTripForm({
      title: trip.title,
      destination: trip.destination,
      description: trip.description,
      price: trip.price,
      availableDates: trip.availableDates,
      image: trip.image,
      category: trip.category,
    });
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/admin/dashboard" className="font-serif text-xl font-bold text-primary">
            Bayt Beirut Admin
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/admin-newsletter">Newsletter</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border bg-muted/30 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge variant="secondary" className="mb-4 gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Protected admin dashboard
                </Badge>
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="mt-3 text-muted-foreground">
                  Revenue, bookings, payments, and recent tourism transactions.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/admin-newsletter">Newsletter Admin</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="mb-8 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="p-5 shadow-md">
              <h2 className="text-xl font-serif font-bold">Admin Profile</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-semibold">{admin?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-semibold">{admin?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge className="mt-1">admin</Badge>
                </div>
              </div>
              <p className="mt-5 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                Security note: this admin login uses hardcoded development credentials only.
              </p>
            </Card>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Bookings" value={bookings.length.toString()} icon={CreditCard} />
              <StatCard title="Total Payments" value={bookings.length.toString()} icon={Wallet} />
              <StatCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign} />
              <StatCard title="Monthly Revenue" value={`$${currentMonthRevenue.toFixed(2)}`} icon={TrendingUp} />
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_520px]">
            <Card className="p-5 shadow-md">
              <h2 className="mb-5 text-2xl font-serif font-bold">Revenue Over Time</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="bookings" fill="hsl(var(--secondary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 shadow-md">
              <h2 className="mb-5 text-2xl font-serif font-bold">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 pr-3">Customer</th>
                      <th className="py-3 pr-3">Type</th>
                      <th className="py-3 pr-3">Amount</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : recentTransactions.length > 0 ? (
                      recentTransactions.map((booking) => (
                        <tr key={`${booking.type}-${booking.id}`} className="border-b last:border-0">
                          <td className="py-3 pr-3">
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-xs text-muted-foreground">{booking.itemName}</p>
                          </td>
                          <td className="py-3 pr-3">{booking.type}</td>
                          <td className="py-3 pr-3 font-semibold">${booking.totalPrice.toFixed(2)}</td>
                          <td className="py-3 pr-3">
                            <Badge className={statusBadgeClass(booking.status)} variant="secondary">
                              {formatStatus(booking.status)}
                            </Badge>
                          </td>
                          <td className="py-3 pr-3">
                            {booking.status.toLowerCase() === "pending" ? (
                              <Button size="sm" variant="outline" onClick={() => acceptBooking(booking)}>
                                <CheckCircle className="h-4 w-4" />
                                Accept Booking
                              </Button>
                            ) : (
                              <span className="text-xs font-medium text-muted-foreground">No action</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No transactions yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[420px_minmax(0,1fr)]">
            <Card className="p-5 shadow-md">
              <h2 className="mb-2 flex items-center gap-2 text-2xl font-serif font-bold">
                <QrCode className="h-5 w-5 text-primary" />
                QR Booking Verification
              </h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Enter or scan a booking ID from a QR ticket to verify it.
              </p>
              <Input
                value={qrBookingId}
                onChange={(event) => setQrBookingId(event.target.value)}
                placeholder="Booking ID"
              />
              <div className="mt-3 flex gap-2">
                <Button type="button" onClick={() => setIsScannerOpen(true)} disabled={isScannerOpen}>
                  Start Scanner
                </Button>
                {isScannerOpen && (
                  <Button type="button" variant="outline" onClick={stopScanner}>
                    Stop
                  </Button>
                )}
              </div>
              {scannerMessage && (
                <p className="mt-3 text-xs text-muted-foreground">{scannerMessage}</p>
              )}
              {isScannerOpen && (
                <div className="mt-4 overflow-hidden rounded-lg border border-border bg-background p-2">
                  <div id="admin-booking-qr-scanner" />
                </div>
              )}
              <div className="mt-4 rounded-lg border border-border bg-background p-4">
                {qrBookingId ? (
                  verifiedBooking ? (
                    <div>
                      <Badge className="mb-2">Verified</Badge>
                      <p className="font-semibold">{verifiedBooking.customerName}</p>
                      <p className="text-sm text-muted-foreground">{verifiedBooking.itemName}</p>
                      <p className="mt-2 text-sm font-semibold">${verifiedBooking.totalPrice.toFixed(2)}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No booking found for this code.</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">Waiting for a booking ID.</p>
                )}
              </div>
            </Card>

            <Card className="p-5 shadow-md">
              <h2 className="mb-5 text-2xl font-serif font-bold">Manage Trips</h2>
              <form onSubmit={handleTripSubmit} className="grid gap-3 md:grid-cols-2">
                <Input
                  value={tripForm.title}
                  onChange={(event) => setTripForm({ ...tripForm, title: event.target.value })}
                  placeholder="Trip title"
                  required
                />
                <Input
                  value={tripForm.destination}
                  onChange={(event) => setTripForm({ ...tripForm, destination: event.target.value })}
                  placeholder="Destination"
                  required
                />
                <Input
                  type="number"
                  value={tripForm.price}
                  onChange={(event) => setTripForm({ ...tripForm, price: Number(event.target.value) })}
                  placeholder="Price"
                />
                <Input
                  value={tripForm.category}
                  onChange={(event) => setTripForm({ ...tripForm, category: event.target.value })}
                  placeholder="Category"
                />
                <Input
                  value={tripForm.availableDates}
                  onChange={(event) => setTripForm({ ...tripForm, availableDates: event.target.value })}
                  placeholder="Available dates"
                  className="md:col-span-2"
                />
                <Input
                  value={tripForm.image}
                  onChange={(event) => setTripForm({ ...tripForm, image: event.target.value })}
                  placeholder="Image URL"
                  className="md:col-span-2"
                />
                <Textarea
                  value={tripForm.description}
                  onChange={(event) => setTripForm({ ...tripForm, description: event.target.value })}
                  placeholder="Description"
                  className="md:col-span-2"
                />
                <div className="flex gap-2 md:col-span-2">
                  <Button type="submit">
                    <Plus className="h-4 w-4" />
                    {editingTripId ? "Update Trip" : "Add Trip"}
                  </Button>
                  {editingTripId && (
                    <Button type="button" variant="outline" onClick={resetTripForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {trips.map((trip) => (
                  <article key={trip.id} className="rounded-lg border border-border bg-background p-4">
                    {trip.image && (
                      <img src={trip.image} alt={trip.title} className="mb-3 h-32 w-full rounded-md object-cover" />
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-xl font-bold">{trip.title}</h3>
                        <p className="text-sm text-muted-foreground">{trip.destination}</p>
                      </div>
                      <Badge>{trip.category || "Trip"}</Badge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{trip.description}</p>
                    <p className="mt-3 text-sm">
                      <span className="font-semibold">${trip.price}</span> - {trip.availableDates}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => startEditingTrip(trip)}>
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => deleteTrip(trip.id)}>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
