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
      console.error(`Firebase check attempt ${i + 1} failed:`, error);
      if (i === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
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
    console.log('Request received:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({
        error: { message: 'Email service not configured' }
      });
    }

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Firebase credentials not configured');
      return res.status(500).json({
        error: { message: 'Database service not configured' }
      });
    }

    const { name, email: rawEmail, language, fullname } = req.body;
    const email = rawEmail?.trim();

    if (!name || !email || !language || !fullname) {
      console.error('Missing required fields:', { name, email, language, fullname });
      return res.status(400).json({
        error: { message: 'Missing required fields: name, email, language, fullname are required' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { message: 'Invalid email format' }
      });
    }

    console.log('Checking if email exists in Firebase:', email);
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      console.log('Email already used:', email);
      return res.status(400).json({
        error: { message: 'Email already used' }
      });
    }

    const isVietnamese = language === 'vi';

    const subject = isVietnamese
      ? 'Vinamilk Sales Trainee Program 2025 – Xác nhận nộp đơn thành công'
      : 'Vinamilk Sales Trainee Program 2025 – Application Confirmation';

    const htmlContent = `
<!DOCTYPE html>
<html lang="${isVietnamese ? 'vi' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFFFF1; margin: 0; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">

    <div style="background-color: #0213b0;">
      <img src="https://vinamilk-email-server.vercel.app/header.png" alt="Sales Trainee Program 2025" style="width: 100%; max-width: 600px; display: block;" />
    </div>

    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">${isVietnamese ? `${name} thân mến,` : `Dear ${name},`}</p>

      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        ${isVietnamese
        ? 'Cảm ơn bạn đã ứng tuyển vào Chương trình Vinamilk Sales Trainee 2025. Chúng tớ đã nhận được hồ sơ ứng tuyển của bạn và sẽ xem xét kỹ lưỡng để thông báo kết quả đến bạn trong thời gian sớm nhất.'
        : 'Thank you for applying to the Vinamilk Sales Trainee Program 2025. We have received your application and will review it carefully to notify you of the results as soon as possible.'}
      </p>

      <div style="border: 2px solid #0213b0; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #0213b0; font-weight: bold;">${isVietnamese ? 'Thông tin ứng tuyển' : 'Application Information'}</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 8px;"><strong>${isVietnamese ? 'Họ và Tên:' : 'Full Name:'}</strong> ${fullname}</li>
          <li style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</li>
          <li style="margin-bottom: 0;"><strong>${isVietnamese ? 'Ngày nộp đơn:' : 'Submitted Date:'}</strong> ${new Date().toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US')}</li>
        </ul>
      </div>

      <div style="margin: 25px 0;">
        <h4 style="margin-bottom: 15px; font-size: 14px; color: #333;">
          <span style="margin-right: 8px;">🔔</span>${isVietnamese ? 'Vòng tiếp theo' : 'Next Round'}
        </h4>
        
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
          ${isVietnamese
        ? 'Các ứng viên vượt qua vòng Đơn ứng tuyển sẽ tiếp tục tham gia Bài kiểm tra năng lực. Bạn vui lòng sắp xếp thời gian cá nhân để tham gia Bài kiểm tra năng lực cùng Vinamilk trong thời gian sắp tới nhé.'
        : 'Candidates who pass the Application round will continue to participate in the Aptitude Test. Please arrange your personal schedule to participate in the Aptitude Test with Vinamilk in the upcoming time.'}
        </p>
      </div>

      <p style="font-size: 14px; line-height: 1.6; margin: 25px 0 15px 0;">
        ${isVietnamese
        ? 'Nếu có bất kỳ thắc mắc nào, bạn có thể liên hệ chúng mình qua:'
        : 'If you have any questions, you can contact us via:'}
      </p>

      <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">
          <strong>Email:</strong> salestrainee@vinamilk.com.vn
        </li>
        <li style="margin-bottom: 0;">
          <strong>Facebook:</strong> facebook.com/LifeAtVinamilk
        </li>
      </ul>

      <p style="font-size: 14px; margin-bottom: 15px;">
        ${isVietnamese
        ? 'Khám phá thêm về Nhịp sống Vinamilk tại: Life At Vinamilk'
        : 'Discover more about Life at Vinamilk at: Life At Vinamilk'}
      </p>

      <p style="font-size: 14px; margin-bottom: 30px;">
        ${isVietnamese
        ? 'Hẹn gặp bạn tại Vinamilk!'
        : 'See you at Vinamilk!'}
      </p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 14px; margin-bottom: 10px;">
          ${isVietnamese ? 'Trân trọng,' : 'Best regards,'}
        </p>
        
        <div style="margin: 20px 0;">
          <img src="https://vinamilk-email-server.vercel.app/logo.png" alt="Vinamilk Logo" style="height: 40px; margin-bottom: 10px;" />
          <p style="font-size: 14px; margin: 5px 0; font-weight: bold; color: #0213b0;">
            VINAMILK SALES TRAINEE 2025
          </p>
        </div>
        
        <div style="font-size: 12px; color: #777; margin-top: 15px;">
          <p style="margin: 2px 0;">
            <a href="https://www.facebook.com/LifeAtVinamilk" style="color: #0213b0; text-decoration: none; margin-right: 10px;">Facebook</a>
            <a href="https://www.linkedin.com/company/vinamilk" style="color: #0213b0; text-decoration: none; margin-right: 10px;">LinkedIn</a>
          </p>
          <p style="margin: 2px 0;">Email: salestrainee@vinamilk.com.vn</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    console.log('Attempting to send email to:', email);

    const result = await resend.emails.send({
      from: 'Vinamilk Sales Trainee Program 2025 <noreply@vcogroup.com.vn>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', result);

    return res.status(200).json({
      success: true,
      messageId: result.data?.id
    });

  } catch (error) {
    console.error('Email sending error:', error);

    let errorMessage = 'Failed to send email';
    if (error.message) {
      errorMessage = error.message;
    }

    return res.status(500).json({
      error: {
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
}