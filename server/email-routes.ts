import type { Express } from "express";
import nodemailer from "nodemailer";

type BookingEmailDetails = Record<string, string | number | null | undefined>;

type BookingEmailRequest = {
  bookingType?: string;
  bookingId?: string;
  username?: string;
  email?: string | null;
  customerName?: string;
  details?: BookingEmailDetails;
};

const adminEmail = "Eventsphere99@gmail.com";

function isEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getTransporter() {
  const user = process.env.SMTP_USER || adminEmail;
  const pass = process.env.SMTP_PASS?.replace(/\s/g, "");

  if (!pass) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail(input: { email?: string | null; name?: string | null; username: string }) {
  if (!isEmail(input.email)) return false;

  const transporter = getTransporter();
  if (!transporter) return false;

  const displayName = input.name || input.username;

  await transporter.sendMail({
    from: `"Bayt Beirut Travel" <${process.env.SMTP_USER || adminEmail}>`,
    to: input.email,
    cc: adminEmail,
    subject: "Welcome to Bayt Beirut Travel",
    html: `
      <div style="margin:0;padding:24px;background:#f6f8f5;font-family:Arial,sans-serif;color:#16251e;">
        <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8e3;">
          <div style="background:#d91f32;color:#ffffff;padding:24px;">
            <h1 style="margin:0;font-size:28px;">Welcome to Bayt Beirut Travel</h1>
            <p style="margin:8px 0 0;font-size:16px;">Your Lebanon journey starts here.</p>
          </div>
          <div style="padding:24px;">
            <p style="font-size:17px;line-height:1.5;">Hi ${escapeHtml(displayName)}, your account was created successfully.</p>
            <p style="font-size:16px;line-height:1.6;color:#56615c;">
              You can now explore Lebanese destinations, save favorite places, plan trips, book experiences, and keep your QR tickets in one place.
            </p>
            <div style="margin-top:20px;padding:16px;border-radius:14px;background:#f8fbf8;border:1px solid #e2e8e3;">
              <strong>Username:</strong> ${escapeHtml(input.username)}
            </div>
          </div>
        </div>
      </div>
    `,
  });

  return true;
}

function renderDetails(details: BookingEmailDetails = {}) {
  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:10px 12px;color:#56615c;border-bottom:1px solid #edf1ef;">${escapeHtml(key)}</td>
          <td style="padding:10px 12px;color:#16251e;border-bottom:1px solid #edf1ef;font-weight:700;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  return rows || `<tr><td style="padding:10px 12px;color:#56615c;">No extra details.</td></tr>`;
}

function renderBookingEmail(input: Required<Pick<BookingEmailRequest, "bookingType" | "bookingId" | "customerName">> & BookingEmailRequest) {
  return `
    <div style="margin:0;padding:24px;background:#f6f8f5;font-family:Arial,sans-serif;color:#16251e;">
      <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8e3;">
        <div style="background:#d91f32;color:#ffffff;padding:24px;">
          <h1 style="margin:0;font-size:28px;">Bayt Beirut Travel</h1>
          <p style="margin:8px 0 0;font-size:16px;">Your booking confirmation</p>
        </div>
        <div style="padding:24px;">
          <p style="font-size:17px;line-height:1.5;">Hi ${escapeHtml(input.customerName)}, your booking was received successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:18px;background:#fbfcfb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:10px 12px;color:#56615c;border-bottom:1px solid #edf1ef;">Booking ID</td>
              <td style="padding:10px 12px;color:#16251e;border-bottom:1px solid #edf1ef;font-weight:700;">${escapeHtml(input.bookingId)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#56615c;border-bottom:1px solid #edf1ef;">Booking type</td>
              <td style="padding:10px 12px;color:#16251e;border-bottom:1px solid #edf1ef;font-weight:700;">${escapeHtml(input.bookingType)}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;color:#56615c;border-bottom:1px solid #edf1ef;">Username</td>
              <td style="padding:10px 12px;color:#16251e;border-bottom:1px solid #edf1ef;font-weight:700;">${escapeHtml(input.username || "Guest")}</td>
            </tr>
            ${renderDetails(input.details)}
          </table>
          <p style="margin-top:20px;color:#56615c;line-height:1.5;">Show your QR ticket from My Trips when you arrive. This email does not include sensitive payment information.</p>
        </div>
      </div>
    </div>
  `;
}

export function registerEmailRoutes(app: Express) {
  app.get("/api/debug/email", (_req, res) => {
    res.json({
      configured: Boolean(process.env.SMTP_PASS),
      hasHost: Boolean(process.env.SMTP_HOST),
      hasUser: Boolean(process.env.SMTP_USER),
      hasPass: Boolean(process.env.SMTP_PASS),
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 587),
      user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/^(.{2}).*(@.*)$/, "$1***$2") : null,
    });
  });

  app.post("/api/email/booking", async (req, res) => {
    try {
      const input = req.body as BookingEmailRequest;
      if (!input.bookingId || !input.bookingType || !input.customerName) {
        return res.status(400).json({ message: "Booking ID, type, and customer name are required" });
      }

      const transporter = getTransporter();
      if (!transporter) {
        return res.status(503).json({ message: "Email is not configured" });
      }

      const to = isEmail(input.email) ? input.email : adminEmail;
      const cc = to.toLowerCase() === adminEmail.toLowerCase() ? undefined : adminEmail;

      await transporter.sendMail({
        from: `"Bayt Beirut Travel" <${process.env.SMTP_USER || adminEmail}>`,
        to,
        cc,
        subject: `Bayt Beirut Travel booking confirmation - ${input.bookingId}`,
        html: renderBookingEmail({
          bookingType: input.bookingType,
          bookingId: input.bookingId,
          customerName: input.customerName,
          username: input.username,
          email: input.email,
          details: input.details || {},
        }),
      });

      res.json({ message: "Booking email sent" });
    } catch (error) {
      console.error("Booking email error:", error);
      res.status(500).json({ message: "Could not send booking email" });
    }
  });
}
