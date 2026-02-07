import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const { email, name, amount } = await req.json();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Bill Payment Warning ⚠️",
    text: `
Hello ${name},

Your mess bill (${amount} ৳) is still unpaid.

Please pay within the next 10 days.
Otherwise your account will be blocked.

Thank you.
    `,
  });

  return Response.json({ success: true });
}
