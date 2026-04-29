import { useEffect, useState, useRef } from "react";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Trash2, Download, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "@/contexts/auth-context";
import { QRCodeCanvas } from "qrcode.react";
import { createBookingQrValue } from "@/lib/booking-qr";
import { bookingBelongsToUser, readUserBookingIds } from "@/lib/user-scope";

interface TransportBooking {
  id: string;
  customerName: string;
  bookingType: "Transport" | "Place";
  carName: string;
  carType: string;
  distance: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  visitDate?: string;
}

function getBookingStatusMeta(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "accepted") {
    return {
      label: "Accepted",
      description: "Your booking was approved by admin. Your QR ticket is ready.",
      barClass: "bg-emerald-500",
      badgeClass: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
    };
  }

  if (normalized === "paid" || normalized === "completed") {
    return {
      label: "Paid",
      description: "Payment is complete. Bring your QR ticket with you.",
      barClass: "bg-green-600",
      badgeClass: "bg-green-100 text-green-800 hover:bg-green-100",
    };
  }

  if (normalized === "used") {
    return {
      label: "Checked in",
      description: "This ticket was already scanned and used.",
      barClass: "bg-blue-500",
      badgeClass: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    };
  }

  if (normalized === "cancelled") {
    return {
      label: "Cancelled",
      description: "This booking is cancelled and the ticket is disabled.",
      barClass: "bg-red-500",
      badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
    };
  }

  if (normalized === "failed") {
    return {
      label: "Failed",
      description: "Payment or booking failed. Please try booking again.",
      barClass: "bg-red-500",
      badgeClass: "bg-red-100 text-red-800 hover:bg-red-100",
    };
  }

  return {
    label: "Pending review",
    description: "Waiting for admin approval. You can still view your ticket.",
    barClass: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  };
}

export default function Bookings() {
  const [bookings, setBookings] = useState<TransportBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const ticketRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [transportResponse, poiResponse] = await Promise.all([
        fetch("/api/transport/bookings"),
        fetch("/api/poi/bookings"),
      ]);

      if (!transportResponse.ok && !poiResponse.ok) {
        throw new Error("Could not load bookings");
      }

      const transportData = transportResponse.ok ? await transportResponse.json() : [];
      const poiData = poiResponse.ok ? await poiResponse.json() : [];
      const userBookingIds = readUserBookingIds(user);

      const mappedTransportData = transportData.map((booking: any) => ({
        id: booking.id,
        bookingType: "Transport" as const,
        customerName: booking.customerName || booking.customer_name || "N/A",
        carName: booking.carName || booking.car_name || "N/A",
        carType: booking.carType || booking.car_type || "N/A",
        distance: booking.distance || 0,
        totalPrice: booking.totalPrice || booking.total_price || "0.00",
        status: booking.status || "pending",
        createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
      }));

      const mappedPoiData = poiData.map((booking: any) => ({
        id: booking.id,
        bookingType: "Place" as const,
        customerName: booking.customerName || booking.customer_name || "N/A",
        carName: booking.poiName || booking.poi_name || "Lebanon visit",
        carType: "Tourist place",
        distance: 0,
        totalPrice: booking.totalPrice || booking.total_price || "0.00",
        status: booking.status || "pending",
        createdAt: booking.createdAt || booking.created_at || booking.visitDate || booking.visit_date || new Date().toISOString(),
        visitDate: booking.visitDate || booking.visit_date,
      }));

      const mappedData = [...mappedTransportData, ...mappedPoiData]
        .filter((booking: TransportBooking) => bookingBelongsToUser(booking, user, userBookingIds))
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.visitDate || 0).getTime() -
            new Date(a.createdAt || a.visitDate || 0).getTime()
        );

      setBookings(mappedData);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast({
        title: "Failed to load bookings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async (booking: TransportBooking) => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      // Add header
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Bayt Beirut Travel", 20, 20);
      doc.setFontSize(12);
      doc.text("Transport Ticket", 20, 30);
      
      // Add content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text("Booking Confirmation", 20, 60);
      
      doc.setFontSize(11);
      let yPos = 80;
      
      const details: Array<[string, string]> = [
        ["Passenger Name:", booking.customerName || 'N/A'],
        [booking.bookingType === "Place" ? "Destination:" : "Vehicle:", `${booking.carName || 'N/A'} (${booking.carType || 'N/A'})`],
        [
          booking.bookingType === "Place" ? "Visit Date:" : "Distance:",
          booking.bookingType === "Place"
            ? new Date(booking.visitDate || booking.createdAt).toLocaleDateString()
            : `${booking.distance || 0} km`,
        ],
        ["Total Price:", `$${booking.totalPrice || '0.00'}`],
        ["Status:", (booking.status || 'pending').toUpperCase()],
        ["Booking ID:", String(booking.id)],
        ["Booking Date:", booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'],
      ];
      
      details.forEach((detail) => {
        doc.setFont("helvetica", "bold");
        doc.text(detail[0], 20, yPos);
        doc.setFont("helvetica", "normal");
        doc.text(detail[1], 80, yPos);
        yPos += 10;
      });

      const qrCanvas = document.getElementById(`booking-qr-${booking.id}`) as HTMLCanvasElement | null;
      if (qrCanvas) {
        const qrImage = qrCanvas.toDataURL("image/png");
        doc.addImage(qrImage, "PNG", 150, 72, 38, 38);
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text("Scan to verify", 151, 116);
      }
      
      // Add footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for booking with Bayt Beirut Travel", 20, 270);
      doc.text("This ticket is valid for one trip only", 20, 280);
      
      doc.save(`transport-ticket-${booking.id}.pdf`);
      toast({ title: "✅ Ticket downloaded successfully!" });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({ title: "Failed to download ticket", variant: "destructive" });
    }
  };

  const handleCancelBooking = async (booking: TransportBooking) => {
    try {
      const endpoint =
        booking.bookingType === "Place"
          ? `/api/poi/bookings/${booking.id}/status`
          : `/api/transport/bookings/${booking.id}/status`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (response.ok) {
        setBookings(bookings.map(b => b.id === booking.id ? { ...b, status: "cancelled" } : b));
        toast({ title: "Booking cancelled successfully" });
        setDeleteId(null);
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast({ title: "Failed to cancel booking", variant: "destructive" });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">My Trips</h1>
          <p className="text-muted-foreground mb-10">Manage your place visits, transport bookings, and QR tickets.</p>

          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Loading your bookings...</p>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id}>
                  {(() => {
                    const statusMeta = getBookingStatusMeta(booking.status);
                    const isDisabled = ["cancelled", "failed"].includes(booking.status.toLowerCase());

                    return (
                  <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className={`h-2 md:h-auto md:w-2 ${statusMeta.barClass}`} />
                      
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-serif text-xl font-bold">{booking.carName}</h3>
                              <Badge variant="secondary" className={statusMeta.badgeClass}>
                                {statusMeta.label}
                              </Badge>
                              <Badge variant="outline">{booking.bookingType}</Badge>
                            </div>
                            <p className="mb-3 max-w-xl text-sm font-medium text-muted-foreground">{statusMeta.description}</p>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>
                                  {booking.bookingType === "Place"
                                    ? "Place visit"
                                    : `${booking.distance}km trip`}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Price</p>
                            <p className="text-2xl font-bold text-primary">${booking.totalPrice}</p>
                          </div>
                        </div>

                        <div className="bg-muted/30 rounded-lg p-4 mb-6">
                          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Booking Details</h4>
                          <div className="grid grid-cols-2 md:grid-cols-[repeat(4,minmax(0,1fr))_112px] gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Passenger</p>
                              <p className="font-medium">{booking.customerName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {booking.bookingType === "Place" ? "Type" : "Vehicle"}
                              </p>
                              <p className="font-medium">{booking.carType}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {booking.bookingType === "Place" ? "Visit" : "Distance"}
                              </p>
                              <p className="font-medium">
                                {booking.bookingType === "Place"
                                  ? new Date(booking.visitDate || booking.createdAt).toLocaleDateString()
                                  : `${booking.distance} km`}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Booking ID</p>
                              <p className="font-medium text-sm">{String(booking.id).substring(0, 8)}...</p>
                            </div>
                            <div className="col-span-2 md:col-span-1 flex flex-col items-center rounded-md bg-white p-2 text-black">
                              <QRCodeCanvas
                                id={`booking-qr-${booking.id}`}
                                value={createBookingQrValue(booking.id)}
                                size={88}
                                includeMargin
                              />
                              <p className="mt-1 text-center text-[10px] font-medium text-gray-600">Scan ticket</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => handleDownloadPDF(booking)}
                            disabled={isDisabled}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Ticket
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => setDeleteId(booking.id)}
                            disabled={isDisabled}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Cancel Booking
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                    );
                  })()}

                  {/* Hidden ticket for PDF generation */}
                  <div 
                    ref={(el) => { if (el) ticketRefs.current[booking.id] = el; }}
                    style={{ display: 'none' }}
                  >
                    <div style={{ width: '800px', padding: '40px', background: 'white', fontFamily: 'Arial' }}>
                      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>{booking.bookingType} Ticket</h2>
                        <p style={{ color: '#666', margin: 0 }}>Booking Confirmation</p>
                      </div>

                      <div style={{ borderTop: '2px solid #ddd', paddingTop: '20px', marginBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Passenger Name:</strong></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{booking.customerName}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>{booking.bookingType === "Place" ? "Destination:" : "Vehicle:"}</strong></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{booking.carName} ({booking.carType})</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>{booking.bookingType === "Place" ? "Visit Date:" : "Distance:"}</strong></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                                {booking.bookingType === "Place"
                                  ? new Date(booking.visitDate || booking.createdAt).toLocaleDateString()
                                  : `${booking.distance} km`}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Total Price:</strong></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '18px', color: '#0066cc' }}>${booking.totalPrice}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Status:</strong></td>
                              <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{booking.status.toUpperCase()}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '10px' }}><strong>Booking ID:</strong></td>
                              <td style={{ padding: '10px' }}>{booking.id}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '40px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        <p>Thank you for booking with Bayt Beirut Travel</p>
                        <p>This ticket is valid for one trip only</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground mb-4">You haven't made any bookings yet.</p>
              <Button asChild>
                <Link href="/transport">Book Transport</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Are you sure you want to cancel this booking? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Keep Booking</Button>
            <Button
              variant="destructive"
              onClick={() => {
                const booking = bookings.find((item) => item.id === deleteId);
                if (booking) handleCancelBooking(booking);
              }}
            >
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
