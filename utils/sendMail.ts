import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";

interface ISendMail {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async ({
  email,
  subject,
  template,
  data,
}: ISendMail): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const templatePath = path.join(__dirname, `../mails/${template}.ejs`);

  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
