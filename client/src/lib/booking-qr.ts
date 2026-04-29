const qrPrefix = "LEBANON_TOURISM_BOOKING:";

function getTicketBaseUrl() {
  const configuredUrl = import.meta.env.VITE_TICKET_BASE_URL as string | undefined;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function createBookingQrValue(bookingId: string) {
  return `${getTicketBaseUrl()}/ticket/${encodeURIComponent(bookingId)}`;
}

export function extractBookingIdFromQr(value: string) {
  const trimmedValue = value.trim();
  if (trimmedValue.startsWith(qrPrefix)) {
    return trimmedValue.slice(qrPrefix.length);
  }

  try {
    const url = new URL(trimmedValue);
    const ticketMatch = url.pathname.match(/\/ticket\/([^/]+)/);
    if (ticketMatch?.[1]) {
      return decodeURIComponent(ticketMatch[1]);
    }
  } catch {
    const ticketMatch = trimmedValue.match(/\/ticket\/([^/]+)/);
    if (ticketMatch?.[1]) {
      return decodeURIComponent(ticketMatch[1]);
    }
  }

  return trimmedValue;
}
