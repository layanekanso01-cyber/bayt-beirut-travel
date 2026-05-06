import { useParams, useLocation } from "wouter";
import { discountCodes, pois, regions } from "@/lib/data";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MapPin, Clock, Phone, Globe, Calendar, Share2, Heart, Download, CheckCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import NotFound from "@/pages/not-found";
import { LebanonMap } from "@/components/lebanon-map";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import { openBookingEmail } from "@/lib/booking-email";
import { QRCodeCanvas } from "qrcode.react";
import { createBookingQrValue } from "@/lib/booking-qr";
import { rememberUserBooking } from "@/lib/user-scope";
import { poiFromDatabase } from "@/lib/db-poi";
import type { POI } from "@/lib/data";

export default function POIDetails() {
  const params = useParams();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, favorites, toggleFavorite, addReview, getReviews } = useAuth();
  const isAdmin = user?.role === "admin";
  const id = params.id ? parseInt(params.id) : 0;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState("2");
  const [discountCode, setDiscountCode] = useState("");
  const [showTicket, setShowTicket] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [customerName, setCustomerName] = useState(""); // ADD THIS LINE
  const [databasePoi, setDatabasePoi] = useState<POI | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  
  const isFavorited = favorites.includes(id);
  const reviews = getReviews(id);

  useEffect(() => {
    if (isAdmin) {
      setLocation("/admin/dashboard");
      return;
    }

    if (!customerName && user) {
      setCustomerName(user.name || user.username);
    }
  }, [customerName, isAdmin, setLocation, user]);
  
  useEffect(() => {
    if (!id || pois.some((p) => p.id === id)) return;

    fetch(`/api/pois/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load place");
        return response.json();
      })
      .then((data) => setDatabasePoi(poiFromDatabase(data)))
      .catch(() => setDatabasePoi(null));
  }, [id]);

  const poi = pois.find(p => p.id === id) || databasePoi;
  
  if (!poi) {
    return <NotFound />;
  }

  if (isAdmin) {
    return null;
  }

  const region = regions.find(r => r.id === poi.regionId);
  
  const getBasePrice = () => {
    if (poi.type === 'spot') return poi.entranceFee || 0;
    if (poi.type === 'restaurant') return poi.averagePrice || 0;
    return 25;
  };
  
  const basePrice = getBasePrice();
  const guestCount = Math.max(1, parseInt(guests) || 1);
  const subtotal = basePrice * guestCount;
  const serviceFee = 5;
  const discountInfo = discountCodes[discountCode.trim().toUpperCase()];
  const totalBeforeDiscount = subtotal + serviceFee;
  const discountAmount = discountInfo ? totalBeforeDiscount * (discountInfo.percentage / 100) : 0;
  const total = Math.max(0, totalBeforeDiscount - discountAmount);

const handleBook = async () => {
  if (!selectedDate) {
    toast({
      title: "Please select a date",
      description: "Choose a date for your visit to continue.",
      variant: "destructive",
    });
    return;
  }

  try {
    const response = await fetch('/api/poi/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
    customerName: customerName || user?.name || user?.username || "Guest User",       // optional
    poiName: poi.name,                 // camelCase
    visitDate: selectedDate.toISOString(), // camelCase
    numGuests: guestCount,       // camelCase
    totalPrice: total,                 // number
}),

    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Booking failed:", errorData);
      throw new Error('Booking failed');
    }

    const data = await response.json();
    const newBookingId = data.id || `LEB-${Date.now().toString(36).toUpperCase()}`;
    rememberUserBooking(user, newBookingId);
    setBookingId(newBookingId);
    setShowTicket(true);

    toast({
      title: "Booking Confirmed!",
      description: `Your booking for ${poi.name} has been saved to the database.`,
    });

    openBookingEmail({
      bookingType: "POI Visit",
      bookingId: newBookingId,
      username: user?.username,
      email: user?.email,
      customerName: customerName || user?.name || user?.username || "Guest User",
      details: {
        Place: poi.name,
        Region: region?.name || "Lebanon",
        Date: selectedDate ? format(selectedDate, "MMMM d, yyyy") : "N/A",
        Guests: guestCount.toString(),
        Discount: discountInfo ? `${discountInfo.percentage}% off (${discountCode.trim()})` : "None",
        Total: `$${total.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    toast({
      title: "Booking failed",
      description: "There was an error saving your booking. Please try again.",
      variant: "destructive",
    });
  }
};

const handleAddReview = async () => {
  if (!reviewText.trim()) {
    toast({
      title: "Review text required",
      description: "Please enter your review before submitting.",
      variant: "destructive",
    });
    return;
  }

  try {
    // Map your local poi id to the database poi_id format
    const poiId = `poi_${String(id).padStart(3, '0')}`; // e.g., id: 1 -> poi_001
    
    const response = await fetch('http://localhost:5000/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: reviewRating,
        comment: reviewText,
        reviewType: 'poi',
        touristId: 'tour_001', // You should get this from logged-in user
        poiId: poiId,
        bookingId: null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit review');
    }

    // Also add to local context for immediate UI update
    addReview(id, reviewRating, reviewText);
    setReviewText("");
    setReviewRating(5);
    
    toast({
      title: "✅ Review posted!",
      description: "Your review has been saved to the database.",
    });
  } catch (error) {
    console.error("Review submission error:", error);
    toast({
      title: "Review failed",
      description: "Could not save your review. Please try again.",
      variant: "destructive",
    });
  }
};

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Bayt Beirut Travel", 20, 25);
    doc.setFontSize(12);
    doc.text("Your home for discovering Lebanon", 20, 35);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("Booking Confirmation", 20, 70);
    
    doc.setFontSize(12);
    doc.text(`Booking ID: ${bookingId}`, 20, 85);
    doc.text(`Date: ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : "N/A"}`, 20, 95);
    
    doc.setFontSize(14);
    doc.text("Destination Details", 20, 115);
    doc.setFontSize(12);
    doc.text(`Place: ${poi.name}`, 20, 125);
    doc.text(`Type: ${poi.type.charAt(0).toUpperCase() + poi.type.slice(1)}`, 20, 135);
    doc.text(`Region: ${region?.name || "Lebanon"}`, 20, 145);
    doc.text(`Guests: ${guestCount}`, 20, 155);

    const qrCanvas = document.getElementById(`poi-booking-qr-${bookingId}`) as HTMLCanvasElement | null;
    if (qrCanvas) {
      const qrImage = qrCanvas.toDataURL("image/png");
      doc.addImage(qrImage, "PNG", 150, 78, 38, 38);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Scan to verify", 151, 122);
    }
    
    doc.setFontSize(14);
    doc.text("Payment Summary", 20, 175);
    doc.setFontSize(12);
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 20, 185);
    doc.text(`Service Fee: $${serviceFee.toFixed(2)}`, 20, 195);
    if (discountInfo) {
      doc.text(`Discount (${discountInfo.percentage}%): -$${discountAmount.toFixed(2)}`, 20, 205);
    }
    doc.setFontSize(14);
    doc.text(`Total: $${total.toFixed(2)}`, 20, discountInfo ? 220 : 210);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Please present this ticket at the entrance.", 20, 240);
    doc.text("Thank you for choosing Bayt Beirut Travel!", 20, 250);
    doc.text(`Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, 20, 260);
    
    doc.save(`Bayt-Beirut-Booking-${bookingId}.pdf`);
    
    toast({
      title: "Ticket Downloaded",
      description: "Your booking ticket has been saved as a PDF.",
    });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out ${poi.name} in ${region?.name || "Lebanon"} on Bayt Beirut Travel.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: poi.name,
          text: shareText,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "The place link was copied to your clipboard.",
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({
        title: "Share failed",
        description: "Could not share this place right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <Dialog open={showTicket} onOpenChange={setShowTicket}>
        <DialogContent className="sm:max-w-[480px] max-h-[92vh] overflow-y-auto p-0">
          <div className="bg-primary p-6 text-primary-foreground text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-2xl font-serif font-bold mb-1">Booking Confirmed!</DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Your visit has been successfully reserved.
              </DialogDescription>
            </div>
          </div>
          
          <div ref={ticketRef} className="p-6 bg-background">
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-6 space-y-4 relative">
              <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full -translate-y-1/2 border-r border-muted-foreground/20" />
              <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full -translate-y-1/2 border-l border-muted-foreground/20" />
              
              <div className="flex justify-between items-center border-b border-muted-foreground/10 pb-4">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Booking ID</span>
                  <p className="font-mono font-bold text-lg">{bookingId}</p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground/20" />
              </div>

              <div className="flex items-center gap-4 rounded-lg bg-white p-3 text-black">
                {bookingId ? (
                  <QRCodeCanvas id={`poi-booking-qr-${bookingId}`} value={createBookingQrValue(bookingId)} size={96} includeMargin />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md bg-gray-100 text-xs text-gray-500">
                    Preparing
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold">Digital Ticket</p>
                  <p className="text-xs text-gray-600">Scan this QR code to open the mobile ticket view.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                    <img src={poi.image} alt={poi.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{poi.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{poi.type} in {region?.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Date</span>
                    <p className="font-medium">{selectedDate ? format(selectedDate, "MMM d, yyyy") : "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Guests</span>
                    <p className="font-medium">{guestCount}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-muted-foreground">Total Price</span>
                    <p className="font-bold text-primary text-lg">${total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background p-6 pt-3 sm:justify-between gap-3 border-t">
            <Button variant="outline" onClick={() => setShowTicket(false)} className="flex-1">
              Close
            </Button>
            <Button onClick={handleDownloadPDF} className="flex-1 gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <main className="flex-1">
        <div className="h-[50vh] w-full relative">
          <img 
            src={poi.image} 
            alt={poi.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
            <div className="container mx-auto">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex gap-2 mb-4">
                     <Badge className="capitalize" variant="secondary">{poi.type}</Badge>
                     {region && <Badge variant="outline" className="bg-white/10 text-foreground backdrop-blur-md border-white/20">{region.name}</Badge>}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-2 drop-shadow-sm">
                    {poi.name}
                  </h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-foreground">{poi.rating}</span>
                      <span className="text-sm">(128 reviews)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{region?.name}, Lebanon</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="rounded-full"
                    onClick={() => toggleFavorite(id)}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-full bg-background/50 backdrop-blur-sm" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button size="lg" className="rounded-full px-8" onClick={handleBook}>
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h2 className="text-2xl font-serif font-bold mb-4">About</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {poi.description}
                </p>
              </section>

              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 mb-6">
                  <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Details</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Reviews</TabsTrigger>
                  <TabsTrigger value="map" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3">Map</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card p-6 rounded-xl border border-border/50 space-y-4">
                      <h3 className="font-serif font-semibold text-lg">Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">Open today: 9:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground">+961 1 234 567</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Globe className="w-4 h-4 text-primary" />
                          <span className="text-muted-foreground underline cursor-pointer">Visit Website</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border/50 space-y-4">
                      <h3 className="font-serif font-semibold text-lg">Pricing</h3>
                      <div className="space-y-3">
                        {poi.type === 'spot' && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Entrance Fee</span>
                            <span className="font-bold text-lg">${poi.entranceFee}</span>
                          </div>
                        )}
                        {poi.type === 'restaurant' && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Average Price</span>
                            <span className="font-bold text-lg">${poi.averagePrice} / person</span>
                          </div>
                        )}
                        {poi.type === 'shop' && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Price Range</span>
                            <span className="font-bold text-lg">{poi.priceRange}</span>
                          </div>
                        )}
                         <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Booking Fee</span>
                            <span className="font-bold text-lg text-muted-foreground line-through">$5.00</span>
                          </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="bg-card p-6 rounded-xl border border-border/50 space-y-4">
                    <h3 className="font-serif font-bold text-lg">Add Your Review</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="transition"
                          >
                            <Star 
                              className={`w-6 h-6 ${star <= reviewRating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Your Review</label>
                      <Textarea
                        placeholder="Share your experience..."
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        className="min-h-24"
                      />
                    </div>
                    
                    <Button onClick={handleAddReview} className="w-full gap-2">
                      <Send className="w-4 h-4" />
                      Post Review
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {reviews.length > 0 ? (
                      reviews.map((review, idx) => (
                        <div key={idx} className="bg-card p-6 rounded-xl border border-border/50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">U</div>
                              <div>
                                <p className="font-semibold text-sm">You</p>
                                <p className="text-xs text-muted-foreground">{format(new Date(review.date), 'MMM d, yyyy')}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm">{review.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No reviews yet. Be the first to share your experience!
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="map" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <LebanonMap selectedPOI={poi} showAllPOIs={false} height="400px" />
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-2xl border border-border shadow-lg p-6 space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-xl mb-1">Book your visit</h3>
                  <p className="text-sm text-muted-foreground">Select a date to check availability</p>
                </div>
              
                <div className="space-y-4">
                  <div className="grid gap-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                {user?.email && (
                  <p className="text-xs text-muted-foreground">
                    Booking email will include {user.username} ({user.email})
                  </p>
                )}
              </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal w-full">
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Select a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Guests</label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={guests}
                      onChange={(event) => setGuests(event.target.value)}
                      onBlur={() => setGuests(String(Math.max(1, parseInt(guests) || 1)))}
                      placeholder="Enter number of guests"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Discount Code</label>
                    <Input
                      type="text"
                      placeholder="Enter code 10 for 10% off"
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value)}
                    />
                    {discountCode.trim() && (
                      <p className={`text-xs ${discountInfo ? "text-green-700" : "text-muted-foreground"}`}>
                        {discountInfo ? discountInfo.description : "Code not active"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Subtotal ({guestCount} guest{guestCount > 1 ? 's' : ''} x ${basePrice})</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-sm">
                    <span>Service Fee</span>
                    <span className="font-medium">${serviceFee.toFixed(2)}</span>
                  </div>
                  {discountInfo && (
                    <div className="flex justify-between mb-4 text-sm text-green-700">
                      <span>Discount ({discountInfo.percentage}%)</span>
                      <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button size="lg" className="w-full font-bold" onClick={handleBook}>
                  Confirm Booking
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  You won't be charged yet.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
