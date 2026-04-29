import { Navbar, Footer } from "@/components/layout";
import { cars, discountCodes, regions, pois } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Car as CarIcon, MapPin, Calculator, Info, Download, CheckCircle, Ticket, Tag, Navigation, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { calculateDistance, getUserLocation } from "@/lib/distance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LebanonMap } from "@/components/lebanon-map";
import { openBookingEmail } from "@/lib/booking-email";
import { QRCodeCanvas } from "qrcode.react";
import { createBookingQrValue } from "@/lib/booking-qr";
import { rememberUserBooking } from "@/lib/user-scope";

export default function Transport() {
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [distance, setDistance] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [discountCode, setDiscountCode] = useState<string>("");
  const [showTicket, setShowTicket] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<string>("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [, navigate] = useLocation();

  // Get all destinations (regions + POIs)
  const allDestinations = [
    ...regions.map(r => ({ id: `region-${r.id}`, name: r.name, lat: r.latitude, lon: r.longitude, type: 'region' })),
    ...pois.map(p => ({ id: `poi-${p.id}`, name: p.name, lat: p.latitude, lon: p.longitude, type: 'poi' }))
  ].filter(d => d.lat && d.lon);

  const selectedDestinationObj = allDestinations.find(d => d.id === selectedDestination);

  const selectedCar = cars.find(c => c.id === selectedCarId);
  const basePrice = selectedCar && distance ? (selectedCar.pricePerKm * parseFloat(distance)).toFixed(2) : null;
  
  const discountInfo = discountCodes[discountCode.toUpperCase()];
  const discountAmount = discountInfo && basePrice ? (parseFloat(basePrice) * discountInfo.percentage / 100).toFixed(2) : "0.00";
  const calculatedPrice = basePrice ? (parseFloat(basePrice) - parseFloat(discountAmount)).toFixed(2) : null;

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/dashboard");
      return;
    }

    if (!customerName && user) {
      setCustomerName(user.name || user.username);
    }
  }, [customerName, isAdmin, navigate, user]);

  if (isAdmin) {
    return null;
  }

  const handleCalculateDistance = async () => {
    if (!selectedDestination) {
      toast({
        title: "Select Destination",
        description: "Please choose a destination to calculate distance.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculatingDistance(true);
    try {
      const location = await getUserLocation();
      
      if (!location) {
        toast({
          title: "Location Access Denied",
          description: "Please enable location access in your browser settings.",
          variant: "destructive",
        });
        setIsCalculatingDistance(false);
        return;
      }

      setUserLocation({ lat: location.latitude, lon: location.longitude });
      const destination = allDestinations.find(d => d.id === selectedDestination);
      if (!destination) return;

      const calculatedDist = calculateDistance(
        location.latitude,
        location.longitude,
        destination.lat!,
        destination.lon!
      );

      setDistance(calculatedDist.toString());
      toast({
        title: "Distance Calculated",
        description: `${calculatedDist}km from your location to ${destination.name}`,
      });
    } catch (error) {
      console.error("Distance calculation error:", error);
      toast({
        title: "Calculation Failed",
        description: "Could not calculate distance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalculatingDistance(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedCar) {
      toast({
        title: "Vehicle Required",
        description: "Please select a vehicle to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (!customerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your name to continue.",
        variant: "destructive",
      });
      return;
    }
    
    const distanceNum = parseFloat(distance);
    if (!distance || isNaN(distanceNum) || distanceNum <= 0) {
      toast({
        title: "Valid Distance Required",
        description: "Please enter a valid distance in kilometers.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/transport/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  customerName,
  carType: selectedCar.type,
  carName: selectedCar.name,
  destination: selectedDestinationObj?.name || '',
  distance: Math.round(distanceNum),
  pricePerKm: selectedCar.pricePerKm.toFixed(2),
          totalPrice: calculatedPrice!,
          status: "pending",
        }),
      });

      if (!response.ok) {
        throw new Error("Booking failed");
      }

      const booking = await response.json();
setTicketId(booking.id);
rememberUserBooking(user, booking.id);

// Store the current booking data
setCurrentBooking({
  id: booking.id,
  carName: selectedCar.name,
  carType: selectedCar.type,
  distance: distance,
  totalPrice: calculatedPrice,
  customerName: customerName
});

toast({
  title: "Transport Booked!",
  description: `Your ${selectedCar.name} has been reserved for ${distance}km. Check My Trips to download your ticket.`,
});
setShowTicket(true);

openBookingEmail({
  bookingType: "Transport",
  bookingId: booking.id,
  username: user?.username,
  email: user?.email,
  customerName,
  details: {
    Vehicle: selectedCar.name,
    Type: selectedCar.type,
    Destination: selectedDestinationObj?.name || "Not selected",
    Distance: `${distance} km`,
    Total: `$${calculatedPrice}`,
  },
});

      // Reset form after a delay
      
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Could not complete your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!selectedCar || !calculatedPrice) return;
    
    const doc = new jsPDF();
    
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Bayt Beirut Travel", 20, 25);
    doc.setFontSize(12);
    doc.text("Transport Booking Confirmation", 20, 35);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("Transport Ticket", 20, 70);
    
    doc.setFontSize(12);
    doc.text(`Ticket ID: ${ticketId}`, 20, 85);
    doc.text(`Date: ${format(new Date(), "MMMM d, yyyy")}`, 20, 95);
    doc.text(`Customer: ${customerName}`, 20, 105);
    
    doc.setFontSize(14);
    doc.text("Vehicle Details", 20, 125);
    doc.setFontSize(12);
    doc.text(`Vehicle: ${selectedCar.name}`, 20, 135);
    doc.text(`Type: ${selectedCar.type}`, 20, 145);
    doc.text(`Seats: ${selectedCar.seats}`, 20, 155);
    
    doc.setFontSize(14);
    doc.text("Trip Details", 20, 175);
    doc.setFontSize(12);
    doc.text(`Distance: ${distance} km`, 20, 185);
    doc.text(`Rate: $${selectedCar.pricePerKm.toFixed(2)} per km`, 20, 195);
    
    doc.setFontSize(16);
    doc.setTextColor(41, 128, 185);
    doc.text(`Total Price: $${calculatedPrice}`, 20, 215);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Present this ticket to your driver upon arrival.", 20, 240);
    doc.text("For assistance, contact: +961 1 234 567", 20, 250);
    doc.text(`Generated on: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, 20, 260);
    
    doc.save(`Bayt-Beirut-Transport-${ticketId}.pdf`);
    
    toast({
      title: "Ticket Downloaded",
      description: "Your transport ticket has been saved as a PDF.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <Dialog open={showRouteMap} onOpenChange={setShowRouteMap}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
          <div className="bg-primary p-4 text-primary-foreground flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Route Map
            </DialogTitle>
            <button onClick={() => setShowRouteMap(false)} className="text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4">
            {userLocation && selectedDestinationObj ? (
              <div className="space-y-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">From</Label>
                      <p className="font-semibold">Your Location</p>
                      <p className="text-xs text-muted-foreground">({userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)})</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">To</Label>
                      <p className="font-semibold">{selectedDestinationObj.name}</p>
                      <p className="text-xs text-muted-foreground">({selectedDestinationObj.lat?.toFixed(4)}, {selectedDestinationObj.lon?.toFixed(4)})</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg overflow-hidden border border-border shadow-md">
                  <div style={{ height: '400px' }}>
                    <LebanonMap selectedPOI={selectedDestinationObj.type === 'poi' ? pois.find(p => p.id === parseInt(selectedDestination.split('-')[1])) : undefined} showAllPOIs={false} height="400px" interactive={true} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Label className="text-xs text-blue-900 dark:text-blue-100 uppercase">Distance</Label>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{distance} km</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
                    <Label className="text-xs text-green-900 dark:text-green-100 uppercase">Estimated Cost</Label>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">${calculatedPrice || '0.00'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Calculate distance first to view the route map</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTicket} onOpenChange={setShowTicket}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden print:shadow-none print:border-none">
          <div className="bg-primary p-6 text-primary-foreground text-center relative overflow-hidden">
            <div className="relative z-10">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
              <p className="text-sm opacity-90">Your transport has been successfully booked</p>
            </div>
            <div className="absolute inset-0 opacity-5">
              <Ticket className="w-40 h-40 absolute -top-10 -right-10 rotate-45" />
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground uppercase">Booking ID</Label>
              <p className="font-mono font-bold text-lg">{ticketId}</p>
            </div>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-white p-3 text-black">
              {ticketId ? (
                <QRCodeCanvas value={createBookingQrValue(ticketId)} size={96} includeMargin />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Vehicle</Label>
                <p className="font-semibold">{selectedCar?.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase">Distance</Label>
                <p className="font-semibold">{distance} km</p>
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <Label className="text-xs text-muted-foreground uppercase">Total Price</Label>
              <p className="text-3xl font-bold text-primary">${calculatedPrice}</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                Your booking has been saved. Go to <strong>My Trips</strong> to download your full ticket or manage your booking.
              </p>
            </div>
          </div>

          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setShowTicket(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
              Transportation Services
            </h1>
            <p className="text-muted-foreground">Book reliable transport for your journey across Lebanon</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Trip Calculator */}
            <div>
              <Card className="sticky top-20 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Trip Calculator
                  </CardTitle>
                  <CardDescription>Select a vehicle and enter distance to estimate cost.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      Quick Distance Calculator
                    </Label>
                    <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                      <SelectTrigger className="bg-card mb-2">
                        <SelectValue placeholder="Select destination..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allDestinations.map(dest => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.name} {dest.type === 'poi' ? '(POI)' : '(Region)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCalculateDistance} 
                        disabled={isCalculatingDistance || !selectedDestination}
                        className="flex-1 gap-2"
                        variant="outline"
                      >
                        <Navigation className="w-4 h-4" />
                        {isCalculatingDistance ? 'Calculating...' : 'Calculate'}
                      </Button>
                      <Button 
                        onClick={() => setShowRouteMap(true)}
                        disabled={!userLocation || !selectedDestinationObj}
                        className="flex-1 gap-2"
                        variant="secondary"
                      >
                        <MapPin className="w-4 h-4" />
                        View Map
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="name" className="text-sm font-medium">Your Name</Label>
                    <Input 
                      id="name"
                      placeholder="Enter your name" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                    {user?.email && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Booking email will include {user.username} ({user.email})
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="distance" className="text-sm font-medium">Distance (km)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <Input 
                        id="distance"
                        type="number" 
                        placeholder="e.g. 45" 
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Vehicle</Label>
                    <p className="text-sm font-medium mt-2">{selectedCar ? selectedCar.name : 'None selected'}</p>
                  </div>

                  {selectedCar && distance && calculatedPrice && (
                    <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
                      <Label className="text-xs text-muted-foreground uppercase">Estimated Total</Label>
                      <p className="text-3xl font-bold text-primary mt-2">${calculatedPrice}</p>
                      <p className="text-xs text-muted-foreground mt-2">${selectedCar.pricePerKm.toFixed(2)} per km</p>
                    </div>
                  )}

                  <Button 
                    onClick={handleBooking} 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Booking..." : "Book Now"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Vehicle Selection */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <CarIcon className="w-6 h-6" />
                  Select Vehicle
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cars.map((car) => (
                    <Card 
                      key={car.id} 
                      className={`cursor-pointer transition-all ${
                        selectedCarId === car.id 
                          ? 'ring-2 ring-primary shadow-lg' 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedCarId(car.id)}
                    >
                      <div className="relative">
                        <img 
                          src={car.image} 
                          alt={car.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {selectedCarId === car.id && (
                          <div className="absolute top-3 right-3 bg-primary text-white rounded-full p-2">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase">
                          {car.type}
                        </span>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{car.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{car.description}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Seats:</span>
                            <span className="font-medium">{car.seats}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price per km:</span>
                            <span className="font-bold text-primary">${car.pricePerKm.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="bg-muted rounded p-3">
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            <li>✓ Professional Driver</li>
                            <li>✓ 24/7 Support</li>
                            <li>✓ Insurance Included</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
