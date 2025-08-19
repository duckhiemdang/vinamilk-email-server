import { Resend } from 'resend';
import admin from 'firebase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: 'https://vinamilk-vform-salestrainee-default-rtdb.asia-southeast1.firebasedatabase.app',
  });
}

const db = admin.database();

async function checkEmailExists(email, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const contestantsRef = db.ref('contestant');
      const snapshot = await contestantsRef.orderByChild('personalInfo/email').equalTo(email.toLowerCase()).once('value');
      return snapshot.exists();
    } catch (error) {
      if (i === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function formatDateForLocale(date, isVietnamese) {
  return new Date(date).toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function buildEmailHtml({ isVietnamese, name, fullname, email }) {
  const subject = isVietnamese
    ? 'Vinamilk Sales Trainee 2025 – Xác nhận nộp đơn thành công'
    : 'Vinamilk Sales Trainee 2025 – Application Confirmation';

  const submittedDate = new Date();
  const submittedDateStr = submittedDate.toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', { timeZone: 'Asia/Ho_Chi_Minh' });

  const vi = `
<!DOCTYPE html>
<html lang="vi">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
</head>

<body
    style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: white; margin: 0; padding: 20px; color: #333;">
    <div
        style="max-width: 600px; margin: auto; background-color: #FFFFF1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #0213b0;">
            <img src="https://vinamilk-email-server.vercel.app/header.png" alt="Sales Trainee 2025"
                style="width: 100%; max-width: 600px; display: block;" />
        </div>
        <div style="padding: 30px;">
            <p style="font-size: 16px; margin-bottom: 20px;">${name} thân mến,</p>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Cảm ơn bạn đã quan tâm và ứng tuyển vào Chương trình Vinamilk Sales Trainee 2025.
            </p>
            <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Hồ sơ của bạn đã được ghi nhận trên hệ thống ứng tuyển và hiện đang trong quá trình đánh giá.
                Kết quả vòng Hồ sơ ứng tuyển sẽ được gửi đến bạn trong khoảng thời gian từ
                <strong style="color: #0213b0;">15 – 21/09/2025</strong>
                qua E-mail.
            </p>

            <div style="border: 2px solid #0213b0; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #0213b0; font-weight: bold;">
                    Thông tin ứng tuyển</h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
                    <li style="margin-bottom: 8px;"><strong>Họ và Tên:</strong> ${fullname}</li>
                    <li style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</li>
                    <li style="margin-bottom: 0;"><strong>Ngày nộp đơn:</strong> ${submittedDateStr}</li>
                </ul>
            </div>
            <div style="margin: 25px 0;">
                <h4 style="margin-bottom: 15px; font-size: 14px; color: #333;"><span
                        style="margin-right: 8px;">🔔</span>Vòng tiếp theo</h4>
                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
                    Các ứng viên vượt qua Vòng 1 – Hồ sơ ứng tuyển sẽ tiếp tục tham gia Vòng 2 – Kiểm tra năng
                    lực, dự kiến diễn ra từ ngày <strong>18/09 – 23/09</strong>. Bạn vui lòng sắp xếp
                    thời gian để tham gia Bài kiểm tra năng lực cùng Vinamilk nhé.
                </p>
            </div>
            <p style="font-size: 14px; line-height: 1.6; margin: 25px 0 15px 0; font-weight: bold;">
                Nếu có bất kỳ thắc mắc nào, bạn có thể liên hệ chúng mình qua:
            </p>

            <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">
                    <strong>Facebook:</strong>
                    <a href="https://www.facebook.com/LifeAtVinamilk" style="color: #0213b0; text-decoration: none;">
                        facebook.com/LifeAtVinamilk
                    </a>
                </li>
                <li style="margin-bottom: 0;">
                    <strong>Email:</strong>
                    <a href="mailto:salestrainee@vinamilk.com.vn" style="color: #0213b0; text-decoration: none;">
                        salestrainee@vinamilk.com.vn
                    </a>
                </li>
            </ul>

            <p style="font-size: 14px; margin-bottom: 15px;">
                Khám phá thêm về Nhịp sống Vinamilk tại:
                <a href="https://www.facebook.com/LifeAtVinamilk" style="color: #0213b0; text-decoration: none;">
                    Life At Vinamilk
                </a>
            </p>

            </p>
            <p style="font-size: 14px; margin-bottom: 30px;">Hẹn gặp bạn tại Vinamilk!</p>
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="font-size: 14px; margin-bottom: 10px;">Trân trọng,</p>
                <div style="margin: 20px 0;">
                    <p style="font-size: 14px; margin: 5px 0; font-weight: bold; color: #0213b0;">VINAMILK SALES TRAINEE
                        2025</p>
                </div>
                <div style="font-size: 12px; color: #777; margin-top: 15px;">
                    <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
                        <li style="margin-bottom: 8px;"><strong>Facebook:</strong> <a
                                href="https://www.facebook.com/LifeAtVinamilk"
                                style="color: #0213b0; text-decoration: none;">facebook.com/LifeAtVinamilk</a></li>
                        <li style="margin-bottom: 8px;"><strong>LinkedIn:</strong> <a
                                href="https://www.linkedin.com/company/vinamilk"
                                style="color: #0213b0; text-decoration: none;">linkedin.com/company/vinamilk</a></li>
                        <li style="margin-bottom: 0;"><strong>Email:</strong> <a
                                href="mailto:salestrainee@vinamilk.com.vn"
                                style="color: #0213b0; text-decoration: none;">salestrainee@vinamilk.com.vn</a></li>
                    </ul>

                </div>
            </div>
        </div>
    </div>
</body>

</html>

`;

const en = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>

<body
  style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: white; margin: 0; padding: 20px; color: #333;">
  <div
    style="max-width: 600px; margin: auto; background-color: #FFFFF1; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background-color: #0213b0;">
      <img src="https://vinamilk-email-server.vercel.app/header.png" alt="Sales Trainee 2025"
        style="width: 100%; max-width: 600px; display: block;" />
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">Dear ${name},</p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Thank you for your interest and application to the Vinamilk Sales Trainee 2025 program.
      </p>
      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Your application has been recorded in our system and is under review. Results of the Application round will be
        sent to you by E-mail between 
        <strong style="color: #0213b0;">September 15–21, 2025</strong>.
      </p>

      <div style="border: 2px solid #0213b0; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #0213b0; font-weight: bold;">Application Information</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 8px;"><strong>Full Name:</strong> ${fullname}</li>
          <li style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</li>
          <li style="margin-bottom: 0;"><strong>Submitted Date:</strong> ${submittedDateStr}</li>
        </ul>
      </div>

      <div style="margin: 25px 0;">
        <h4 style="margin-bottom: 15px; font-size: 14px; color: #333;">
          <span style="margin-right: 8px;">🔔</span>Next Round
        </h4>
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
          Candidates who pass Round 1 – Application will proceed to 
          <strong>Round 2 – Aptitude Test</strong>, tentatively scheduled for 
          <strong style="color: #0213b0;">September 18–23, 2025</strong>. 
          Please arrange your time to participate in the Aptitude Test with Vinamilk.
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; margin: 25px 0 15px 0; font-weight: bold;">
        If you have any questions, contact us via:
      </p>

      <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">
          <strong>Facebook:</strong>
          <a href="https://www.facebook.com/LifeAtVinamilk" style="color: #0213b0; text-decoration: none;">
            facebook.com/LifeAtVinamilk
          </a>
        </li>
        <li style="margin-bottom: 0;">
          <strong>Email:</strong>
          <a href="mailto:salestrainee@vinamilk.com.vn" style="color: #0213b0; text-decoration: none;">
            salestrainee@vinamilk.com.vn
          </a>
        </li>
      </ul>

      <p style="font-size: 14px; margin-bottom: 15px;">
        Discover more about Life at Vinamilk: 
        <a href="https://www.facebook.com/LifeAtVinamilk" style="color: #0213b0; text-decoration: none;">
          Life At Vinamilk
        </a>
      </p>

      <p style="font-size: 14px; margin-bottom: 30px;">See you at Vinamilk!</p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 14px; margin-bottom: 10px;">Best regards,</p>
        <div style="margin: 20px 0;">
          <p style="font-size: 14px; margin: 5px 0; font-weight: bold; color: #0213b0;">VINAMILK SALES TRAINEE 2025</p>
        </div>
        <div style="font-size: 12px; color: #777; margin-top: 15px;">
          <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Facebook:</strong> <a
                href="https://www.facebook.com/LifeAtVinamilk"
                style="color: #0213b0; text-decoration: none;">facebook.com/LifeAtVinamilk</a></li>
            <li style="margin-bottom: 8px;"><strong>LinkedIn:</strong> <a
                href="https://www.linkedin.com/company/vinamilk"
                style="color: #0213b0; text-decoration: none;">linkedin.com/company/vinamilk</a></li>
            <li style="margin-bottom: 0;"><strong>Email:</strong> <a
                href="mailto:salestrainee@vinamilk.com.vn"
                style="color: #0213b0; text-decoration: none;">salestrainee@vinamilk.com.vn</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</body>

</html>
`;



  return {
    subject,
    html: isVietnamese ? vi : en,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: { message: 'Email service not configured' } });
    }

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      return res.status(500).json({ error: { message: 'Database service not configured' } });
    }

    const { name, email: rawEmail, language, fullname } = req.body;
    const email = rawEmail?.trim();

    if (!name || !email || !language || !fullname) {
      return res.status(400).json({ error: { message: 'Missing required fields: name, email, language, fullname are required' } });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: { message: 'Invalid email format' } });
    }

    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: { message: 'Email already used' } });
    }

    const isVietnamese = language === 'vi';
    const { subject, html } = buildEmailHtml({ isVietnamese, name, fullname, email });

    const result = await resend.emails.send({
      from: 'Vinamilk Sales Trainee 2025 <noreply@vcogroup.com.vn>',
      to: [email],
      subject,
      html,
    });

    return res.status(200).json({ success: true, messageId: result.data?.id });
  } catch (error) {
    let errorMessage = 'Failed to send email';
    if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      error: {
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
  }
}
