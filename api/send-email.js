import { Resend } from 'resend';
import admin from 'firebase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: 'https://vinamilk-3c5bf-default-rtdb.asia-southeast1.firebasedatabase.app',
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
        throw error; // Let it fail properly on final attempt
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
    }
  }
}

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    // Add detailed logging
    console.log('Request received:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({
        error: { message: 'Email service not configured' }
      });
    }

    // Check if Firebase credentials are configured
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
      console.error('Firebase credentials not configured');
      return res.status(500).json({
        error: { message: 'Database service not configured' }
      });
    }

    const { name, email, language, fullname } = req.body;

    // Validate required fields
    if (!name || !email || !language || !fullname) {
      console.error('Missing required fields:', { name, email, language, fullname });
      return res.status(400).json({
        error: { message: 'Missing required fields: name, email, language, fullname are required' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { message: 'Invalid email format' }
      });
    }

    // Check if email already exists in Firebase
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
      ? 'Xác nhận ứng tuyển - Chương trình GTP 2025'
      : 'Application Confirmation - Vinamilk Graduate Talent Program 2025';

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

    <!-- Header Banner -->
    <div style="background-color: #0213b0;">
      <img src="https://vinamilk-email-server.vercel.app/header.png" alt="Graduate Talent Program 2025" style="width: 100%; max-width: 600px; display: block;" />
    </div>

    <!-- Email Content -->
    <div style="padding: 30px;">
      <p style="font-size: 16px; margin-bottom: 20px;">${isVietnamese ? `Chào ${name},` : `Dear ${name},`}</p>

      <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        ${isVietnamese
        ? 'Cảm ơn bạn đã ứng tuyển vào Chương trình Graduate Talent Program 2025 của Vinamilk. Chúng tôi rất vui mừng xác nhận rằng hồ sơ ứng tuyển của bạn đã được nộp thành công.'
        : 'Thank you for applying to Vinamilk Graduate Talent Program 2025. We\'re pleased to confirm that your application has been successfully submitted.'}
      </p>

      <!-- Application Details Box -->
      <div style="border: 2px solid #0213b0; padding: 20px; margin: 25px 0; border-radius: 4px;">
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #0213b0; font-weight: bold;">${isVietnamese ? 'Thông tin ứng tuyển' : 'Application Details'}</h3>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
          <li style="margin-bottom: 8px;"><strong>${isVietnamese ? 'Họ và tên:' : 'Full Name:'}</strong> ${fullname}</li>
          <li style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</li>
          <li style="margin-bottom: 0;"><strong>${isVietnamese ? 'Thời gian nộp:' : 'Submitted:'}</strong> ${new Date().toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US')}</li>
        </ul>
      </div>

      <!-- What happens next section -->
      <div style="margin: 25px 0;">
        <h4 style="margin-bottom: 15px; font-size: 14px; color: #333;">
          <span style="margin-right: 8px;">🔔</span>${isVietnamese ? 'Các bước tiếp theo là gì?' : 'What happens next?'}
        </h4>
        
        <p style="font-size: 14px; line-height: 1.6; margin-bottom: 15px;">
          ${isVietnamese
        ? 'Những ứng viên vượt qua vòng sàng lọc sẽ tiến tới bài Kiểm tra Năng lực, được lên lịch như sau:'
        : 'Candidates who pass the screening round will proceed to the Aptitude Test, scheduled as follows:'}
        </p>

        <ul style="font-size: 14px; margin: 15px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">
            <strong>${isVietnamese ? 'Kiểm tra Năng lực – Đợt 1:' : 'Aptitude Test – Batch 1:'}</strong> 
            ${isVietnamese ? '21–23 tháng 6, 2025' : 'June 21–23, 2025'}
          </li>
          <li style="margin-bottom: 0;">
            <strong>${isVietnamese ? 'Kiểm tra Năng lực – Đợt 2:' : 'Aptitude Test – Batch 2:'}</strong> 
            ${isVietnamese ? '12–15 tháng 7, 2025' : 'July 12–15, 2025'}
          </li>
        </ul>

        <p style="font-size: 14px; color: #d9534f; margin-top: 15px;">
          <span style="margin-right: 5px;">📍</span>
          ${isVietnamese
        ? 'Vui lòng sắp xếp lịch cá nhân để tham gia Kiểm tra Năng lực với Vinamilk trong thời gian tương ứng.'
        : 'Please arrange your personal schedule to participate in the Aptitude Test with Vinamilk during the respective period.'}
        </p>
      </div>

      <!-- Contact Information -->
      <p style="font-size: 14px; line-height: 1.6; margin: 25px 0 15px 0;">
        ${isVietnamese
        ? 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ qua:'
        : 'If you have any questions, feel free to reach out via:'}
      </p>

      <ul style="font-size: 14px; margin: 0 0 25px 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">
          <strong>Email:</strong> graduatetalent@vinamilk.com.vn
        </li>
        <li style="margin-bottom: 0;">
          <strong>Facebook:</strong> facebook.com/LifeAtVinamilk
        </li>
      </ul>

      <!-- Closing Message -->
      <p style="font-size: 14px; margin-bottom: 30px;">
        ${isVietnamese
        ? 'Chúng tôi đánh giá cao sự quan tâm của bạn và chúc bạn may mắn nhất!'
        : 'We appreciate your interest and wish you the very best!'}
      </p>

      <!-- Footer with Logo -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
        <p style="font-size: 14px; margin-bottom: 10px;">
          ${isVietnamese ? 'Trân trọng,' : 'Warm regards,'}
        </p>
        
        <div style="margin: 20px 0;">
          <img src="https://vinamilk-email-server.vercel.app/logo.png" alt="Vinamilk Logo" style="height: 40px; margin-bottom: 10px;" />
          <p style="font-size: 14px; margin: 5px 0; font-weight: bold; color: #0213b0;">
            ${isVietnamese ? 'Đội tổ chức Chương trình Graduate Talent Program' : 'Graduate Talent Program Organizing Team'}
          </p>
        </div>
        
        <div style="font-size: 12px; color: #777; margin-top: 15px;">
          <p style="margin: 2px 0;">10 Tan Trao St, Tan Phu Ward, District 7, Ho Chi Minh City, Vietnam</p>
          <p style="margin: 2px 0;">
            <a href="https://new.vinamilk.com.vn/about-us" style="color: #0213b0; text-decoration: none; margin-right: 10px;">Website</a>
            <a href="https://www.linkedin.com/company/vinamilk/" style="color: #0213b0; text-decoration: none; margin-right: 10px;">LinkedIn</a>
            <a href="https://www.facebook.com/vinamilkofficial" style="color: #0213b0; text-decoration: none;">Facebook</a>
          </p>
          <p style="margin: 10px 0 0 0; font-style: italic;">
            ${isVietnamese
        ? 'Cảm ơn bạn đã cân nhắc tác động môi trường khi in email này.'
        : 'Thank you for considering the environmental impact of printing this email.'}
          </p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

    console.log('Attempting to send email to:', email);

    const result = await resend.emails.send({
      from: 'Vinamilk Graduate Talent Program 2025 <noreply@vcogroup.com.vn>',
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

    // Provide more specific error messages
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