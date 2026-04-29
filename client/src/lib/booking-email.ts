type BookingEmailInput = {
  bookingType: "POI Visit" | "Transport";
  bookingId: string;
  username?: string;
  email?: string | null;
  customerName: string;
  details: Record<string, string | number | undefined | null>;
};

const bookingNotificationEmails = "layanekanso01@gmail.com,ziadchatila2005@gmail.com";

export function openBookingEmail(input: BookingEmailInput) {
  const subject = encodeURIComponent(`Bayt Beirut Travel booking - ${input.bookingId}`);
  const detailsText = Object.entries(input.details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  const body = encodeURIComponent(
    [
      "New Bayt Beirut Travel booking received.",
      "",
      `Booking type: ${input.bookingType}`,
      `Booking ID: ${input.bookingId}`,
      `Username: ${input.username || "Guest"}`,
      `Customer name: ${input.customerName}`,
      `Customer email: ${input.email || "No email saved"}`,
      "",
      "Booking details:",
      detailsText,
    ].join("\n")
  );

  window.location.href = `mailto:${bookingNotificationEmails}?subject=${subject}&body=${body}`;
}
