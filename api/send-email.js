import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Note: Using a Set in serverless functions is problematic as it resets on each invocation
// Consider using a database or external storage for production
const usedEmails = new Set();

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

    // Check if email was already used (Note: this won't work across serverless invocations)
    if (usedEmails.has(email.toLowerCase())) {
      console.log('Email already used:', email);
      return res.status(400).json({ 
        error: { message: 'Email already used' } 
      });
    }

    const isVietnamese = language === 'vi';
    
    const subject = isVietnamese 
      ? 'Xác nhận ứng tuyển - Chương trình GTP 2025'
      : 'Application Confirmation - GTP 2025 Program';

const htmlContent = `
<!DOCTYPE html>
<html lang="${isVietnamese ? 'vi' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FFFFF1; margin: 0; padding: 0; color: #333;">
  <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">

    <!-- Header Image -->
    <div style="background-color: #FFFFF1;">
      <img src="https://your-vercel-domain.vercel.app/header.png" alt="Vinamilk Header" style="width: 100%; max-width: 600px; display: block;" />
    </div>

    <!-- Email Content -->
    <div style="padding: 30px;">
      <p style="font-size: 18px;">${isVietnamese ? `Chào ${name},` : `Dear ${name},`}</p>

      <p style="font-size: 16px; line-height: 1.6;">
        ${isVietnamese 
          ? 'Cảm ơn bạn đã ứng tuyển vào Chương trình GTP 2025 của Vinamilk. Chúng tôi đã nhận được hồ sơ ứng tuyển của bạn.'
          : 'Thank you for applying to Vinamilk\'s GTP 2025 Program. We have received your application successfully.'}
      </p>

      <!-- Application Info Box -->
      <div style="background: #f4f7ff; border-left: 4px solid #0213b0; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; font-size: 16px; color: #0213b0;">${isVietnamese ? 'Thông tin ứng tuyển' : 'Application Details'}</h3>
        <p><strong>${isVietnamese ? 'Họ và tên:' : 'Full Name:'}</strong> ${fullname}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>${isVietnamese ? 'Thời gian nộp:' : 'Submitted:'}</strong> ${new Date().toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US')}</p>
      </div>

      <!-- Next Steps -->
      <div style="background: #fff9e6; padding: 20px; border: 1px solid #ffecb3; border-radius: 8px;">
        <h4 style="margin-top: 0; color: #8a6d3b;">🔔 ${isVietnamese ? 'Các bước tiếp theo' : 'Next Steps'}</h4>
        <ul style="padding-left: 20px; color: #6d4c41;">
          <li>${isVietnamese 
            ? 'Chúng tôi sẽ xem xét hồ sơ của bạn trong vòng 7–10 ngày làm việc.'
            : 'We will review your application within 7–10 business days.'}</li>
          <li>${isVietnamese 
            ? 'Nếu hồ sơ phù hợp, chúng tôi sẽ liên hệ qua email này để thông báo bước tiếp theo.'
            : 'If shortlisted, we will contact you via this email for the next steps.'}</li>
        </ul>
      </div>

      <p style="margin-top: 20px; font-size: 16px;">
        ${isVietnamese 
          ? 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ lại qua email này.'
          : 'If you have any questions, feel free to reach out via this email.'}
      </p>

      <!-- Closing -->
      <p style="text-align: center; font-weight: bold; color: #0213b0; font-size: 18px; margin-top: 30px;">
        ${isVietnamese ? 'Chúc bạn may mắn!' : 'Wishing you the best of luck!'}
      </p>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0 20px;">

      <!-- Footer -->
      <div style="text-align: center; font-size: 13px; color: #777;">
        <p style="margin: 4px 0;"><strong>Vinamilk - Vietnam Dairy Products Joint Stock Company</strong></p>
        <p style="margin: 4px 0;">Email: hr@vinamilk.com.vn</p>
        <p style="margin: 4px 0;">Website: <a href="https://vinamilk.com.vn" style="color: #0213b0; text-decoration: none;">vinamilk.com.vn</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;



    console.log('Attempting to send email to:', email);

    const result = await resend.emails.send({
      from: 'Vinamilk GTP 2025 <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', result);

    // Add email to used set (Note: this won't persist across serverless invocations)
    usedEmails.add(email.toLowerCase());

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