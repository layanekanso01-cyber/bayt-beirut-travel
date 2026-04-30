type BookingEmailInput = {
  bookingType: "POI Visit" | "Transport";
  bookingId: string;
  username?: string;
  email?: string | null;
  customerName: string;
  details: Record<string, string | number | undefined | null>;
};

export async function openBookingEmail(input: BookingEmailInput) {
  try {
    const response = await fetch("/api/email/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Email failed");
    }

    return true;
  } catch (error) {
    console.error("Automatic booking email failed:", error);
    return false;
  }
}
