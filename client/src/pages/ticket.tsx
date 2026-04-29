import { useEffect, useMemo, useState } from "react";
import { useParams } from "wouter";
import { CheckCircle, Clock, QrCode, ShieldCheck, Ticket as TicketIcon, XCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { createBookingQrValue } from "@/lib/booking-qr";

type TicketData = {
  id: string;
  customerName: string;
  type: "Transport" | "POI";
  destination: string;
  dateTime: string;
  status: string;
  paymentStatus: "Paid" | "Pending";
  ticketStatus: "Valid" | "Used" | "Expired";
};

type RawBooking = Record<string, unknown>;

function parseTicketFallback(booking: RawBooking, type: TicketData["type"]): TicketData {
  const status = String(booking.status ?? "pending");
  const dateTime =
    type === "POI"
      ? String(booking.visitDate ?? booking.visit_date ?? booking.bookingDate ?? booking.booking_date ?? new Date().toISOString())
      : String(booking.createdAt ?? booking.created_at ?? new Date().toISOString());

  return {
    id: String(booking.id ?? ""),
    customerName: String(booking.customerName ?? booking.customer_name ?? "Guest"),
    type,
    destination:
      type === "POI"
        ? String(booking.poiName ?? booking.poi_name ?? "Lebanon tour")
        : String(booking.destination ?? booking.carName ?? booking.car_name ?? "Transport booking"),
    dateTime,
    status,
    paymentStatus: ["paid", "completed", "used"].includes(status.toLowerCase()) ? "Paid" : "Pending",
    ticketStatus:
      status.toLowerCase() === "used"
        ? "Used"
        : ["cancelled", "failed"].includes(status.toLowerCase())
          ? "Expired"
          : "Valid",
  };
}

async function loadTicketWithFallback(bookingId: string) {
  const ticketResponse = await fetch(`/api/tickets/${bookingId}`);
  if (ticketResponse.ok) return (await ticketResponse.json()) as TicketData;

  const transportResponse = await fetch(`/api/transport/bookings/${bookingId}`);
  if (transportResponse.ok) {
    return parseTicketFallback(await transportResponse.json(), "Transport");
  }

  const poiResponse = await fetch("/api/poi/bookings");
  if (poiResponse.ok) {
    const poiBookings = (await poiResponse.json()) as RawBooking[];
    const poiBooking = poiBookings.find((booking) => String(booking.id) === bookingId);
    if (poiBooking) return parseTicketFallback(poiBooking, "POI");
  }

  throw new Error("Ticket not found");
}

function statusIcon(status?: TicketData["ticketStatus"]) {
  if (status === "Valid") return <CheckCircle className="h-5 w-5" />;
  if (status === "Used") return <ShieldCheck className="h-5 w-5" />;
  return <XCircle className="h-5 w-5" />;
}

export default function TicketPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!bookingId) {
      setIsLoading(false);
      setTicket(null);
      return;
    }

    async function loadTicket() {
      try {
        setTicket(await loadTicketWithFallback(bookingId || ""));
      } catch (error) {
        setTicket(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [bookingId]);

  const formattedDate = useMemo(() => {
    if (!ticket) return "";
    const date = new Date(ticket.dateTime);
    if (Number.isNaN(date.getTime())) return "Date not available";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }, [ticket]);

  async function handleCheckIn() {
    if (!ticket) return;

    if (ticket.ticketStatus === "Used") {
      toast({
        title: "Already checked in",
        description: "This ticket was already marked as used.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingIn(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/check-in`, {
        method: "PATCH",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Check-in failed");
      setTicket(data);
      toast({ title: "Ticket checked in" });
    } catch (error) {
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Could not update ticket.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingIn(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-sm text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 animate-pulse" />
          <p>Loading ticket...</p>
        </div>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 text-white">
        <Card className="w-full max-w-sm border-red-500/30 bg-white p-6 text-center text-neutral-950">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="text-2xl font-bold">{bookingId ? "Ticket Not Found" : "Missing Booking ID"}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            {bookingId
              ? "This booking ID could not be verified."
              : "This QR code did not include a booking ID. Please use a newly generated ticket QR."}
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-white">
      <section className="mx-auto flex max-w-sm flex-col gap-4">
        <div className="text-center">
          <TicketIcon className="mx-auto mb-2 h-8 w-8 text-sky-300" />
          <h1 className="text-3xl font-black tracking-tight">Bayt Beirut Ticket</h1>
          <p className="mt-1 text-sm text-neutral-300">Secure digital booking pass</p>
        </div>

        <Card className="overflow-hidden border-0 bg-white text-neutral-950 shadow-2xl">
          <div className="bg-sky-600 px-5 py-4 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-sky-100">Destination</p>
                <h2 className="text-2xl font-black leading-tight">{ticket.destination}</h2>
              </div>
              <Badge className="bg-white text-sky-700 hover:bg-white">{ticket.type}</Badge>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-neutral-500">Booking ID</p>
                <p className="break-all font-mono font-bold">{ticket.id}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-neutral-500">Guest</p>
                <p className="font-bold">{ticket.customerName}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs uppercase text-neutral-500">Date & Time</p>
                <p className="font-bold">{formattedDate}</p>
              </div>
            </div>

            <div className="border-y border-dashed border-neutral-300 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-neutral-100 p-3">
                  <p className="text-xs uppercase text-neutral-500">Payment</p>
                  <p className="mt-1 font-black">{ticket.paymentStatus}</p>
                </div>
                <div className="rounded-lg bg-neutral-100 p-3">
                  <p className="text-xs uppercase text-neutral-500">Ticket</p>
                  <p className="mt-1 flex items-center gap-1 font-black">
                    {statusIcon(ticket.ticketStatus)}
                    {ticket.ticketStatus}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="rounded-xl border border-neutral-200 bg-white p-3">
                <QRCodeCanvas value={createBookingQrValue(ticket.id)} size={164} includeMargin />
              </div>
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-500">
                <QrCode className="h-3.5 w-3.5" />
                Re-scan to verify this ticket
              </p>
            </div>

            {isAdmin && (
              <Button
                className="w-full"
                size="lg"
                onClick={handleCheckIn}
                disabled={isCheckingIn || ticket.ticketStatus === "Used" || ticket.ticketStatus === "Expired"}
              >
                {ticket.ticketStatus === "Used" ? "Already Checked In" : "Mark as Checked In"}
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-neutral-400">
          No sensitive payment information is stored in this QR code.
        </p>
      </section>
    </main>
  );
}
