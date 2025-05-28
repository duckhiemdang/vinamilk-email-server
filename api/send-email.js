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
      ? 'Xác nhận đơn ứng tuyển - Chương trình GTP 2025'
      : 'Application Confirmation - GTP 2025 Program';

const htmlContent = `
<!DOCTYPE html>
<html lang="${isVietnamese ? 'vi' : 'en'}" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #f8fafe;
    }
    .email-wrapper {
      width: 100%;
      margin: 0;
      padding: 40px 20px;
      background-color: #f8fafe;
    }
    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(2, 19, 176, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0213b0 0%, #1e3a8a 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(180deg); }
    }
    .logo-area {
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .logo-placeholder {
      width: 120px;
      height: 48px;
      background-color: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #0213b0;
      font-size: 18px;
      letter-spacing: 2px;
    }
    .header-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    .header-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0;
      font-weight: 400;
      position: relative;
      z-index: 1;
    }
    .main-content {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 20px;
      color: #1a1a1a;
      margin-bottom: 24px;
      font-weight: 600;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.7;
      margin-bottom: 32px;
    }
    .info-card {
      background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      position: relative;
    }
    .info-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #0213b0 0%, #1e3a8a 100%);
      border-radius: 2px 0 0 2px;
    }
    .info-card-title {
      font-size: 16px;
      font-weight: 700;
      color: #0213b0;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }
    .info-card-title::before {
      content: '📋';
      margin-right: 8px;
      font-size: 18px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .info-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #2d3748;
      font-size: 14px;
    }
    .info-value {
      color: #4a5568;
      font-size: 14px;
      text-align: right;
      max-width: 60%;
      word-break: break-word;
    }
    .next-steps {
      background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%);
      border: 1px solid #ffd54f;
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
      position: relative;
    }
    .next-steps::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(135deg, #ff8f00 0%, #ff6f00 100%);
      border-radius: 2px 0 0 2px;
    }
    .next-steps-title {
      font-size: 16px;
      font-weight: 700;
      color: #e65100;
      margin: 0 0 16px 0;
      display: flex;
      align-items: center;
    }
    .next-steps-title::before {
      content: '⏳';
      margin-right: 8px;
      font-size: 18px;
    }
    .step-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
    }
    .step-item {
      position: relative;
      padding-left: 28px;
      margin-bottom: 12px;
      color: #5d4037;
      font-size: 14px;
      line-height: 1.6;
    }
    .step-item::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      width: 20px;
      height: 20px;
      background: #4caf50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
    .closing-message {
      text-align: center;
      margin: 40px 0;
      padding: 24px;
      background: linear-gradient(135deg, #f0f4ff 0%, #e1edff 100%);
      border-radius: 12px;
      border: 1px solid #c3dafe;
    }
    .closing-text {
      font-size: 18px;
      font-weight: 600;
      color: #0213b0;
      margin: 0;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
      margin: 40px 0;
      border: none;
    }
    .footer {
      padding: 32px 40px;
      background: #f8fafc;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .company-info {
      margin-bottom: 16px;
    }
    .company-name {
      font-size: 16px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 8px;
    }
    .contact-info {
      font-size: 13px;
      color: #718096;
      margin: 4px 0;
    }
    .website-link {
      color: #0213b0;
      text-decoration: none;
      font-weight: 500;
    }
    .website-link:hover {
      text-decoration: underline;
    }
    .footer-note {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }
    
    /* Mobile Responsive */
    @media only screen and (max-width: 600px) {
      .email-wrapper {
        padding: 20px 10px;
      }
      .main-content,
      .footer {
        padding: 32px 24px;
      }
      .header {
        padding: 40px 24px;
      }
      .header-title {
        font-size: 24px;
      }
      .info-row {
        flex-direction: column;
        align-items: flex-start;
      }
      .info-value {
        text-align: left;
        max-width: 100%;
        margin-top: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <!-- Header -->
      <div class="header">
        <div class="logo-area">
          <div class="logo-placeholder">VINAMILK</div>
        </div>
        <h1 class="header-title">
          ${isVietnamese ? 'XÁC NHẬN ỨNG TUYỂN' : 'APPLICATION CONFIRMED'}
        </h1>
        <p class="header-subtitle">
          ${isVietnamese ? 'Chương trình Tuyển dụng GTP 2025' : 'GTP 2025 Recruitment Program'}
        </p>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="greeting">
          ${isVietnamese ? `Chào ${name},` : `Dear ${name},`}
        </div>

        <div class="message">
          ${isVietnamese 
            ? 'Cảm ơn bạn đã quan tâm và ứng tuyển vào Chương trình Tuyển dụng Nhân tài Tương lai (GTP) 2025 của Vinamilk. Chúng tôi đã nhận được hồ sơ ứng tuyển của bạn thành công.'
            : 'Thank you for your interest in applying to Vinamilk\'s Graduate Trainee Program (GTP) 2025. We have successfully received your application and appreciate the time you\'ve invested in this process.'}
        </div>

        <!-- Application Details Card -->
        <div class="info-card">
          <h3 class="info-card-title">
            ${isVietnamese ? 'Chi tiết đơn ứng tuyển' : 'Application Details'}
          </h3>
          <div class="info-row">
            <span class="info-label">${isVietnamese ? 'Ứng viên:' : 'Applicant:'}</span>
            <span class="info-value">${fullname}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isVietnamese ? 'Thời gian nộp:' : 'Submitted:'}</span>
            <span class="info-value">${new Date().toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">${isVietnamese ? 'Trạng thái:' : 'Status:'}</span>
            <span class="info-value" style="color: #4caf50; font-weight: 600;">
              ${isVietnamese ? 'Đã tiếp nhận' : 'Received'}
            </span>
          </div>
        </div>

        <!-- Next Steps -->
        <div class="next-steps">
          <h4 class="next-steps-title">
            ${isVietnamese ? 'Các bước tiếp theo' : 'What Happens Next'}
          </h4>
          <ul class="step-list">
            <li class="step-item">
              ${isVietnamese 
                ? 'Đội ngũ tuyển dụng sẽ xem xét kỹ lưỡng hồ sơ của bạn trong vòng 7-10 ngày làm việc.'
                : 'Our recruitment team will carefully review your application within 7-10 business days.'}
            </li>
            <li class="step-item">
              ${isVietnamese 
                ? 'Nếu hồ sơ của bạn phù hợp với yêu cầu, chúng tôi sẽ liên hệ qua email này để thông báo về các bước tiếp theo trong quy trình tuyển dụng.'
                : 'If your profile matches our requirements, we will contact you via this email to inform you about the next steps in our recruitment process.'}
            </li>
            <li class="step-item">
              ${isVietnamese 
                ? 'Vui lòng kiểm tra email thường xuyên (bao gồm cả thư mục spam) để không bỏ lỡ thông tin quan trọng.'
                : 'Please check your email regularly (including spam folder) to ensure you don\'t miss any important communications.'}
            </li>
          </ul>
        </div>

        <div class="message">
          ${isVietnamese 
            ? 'Nếu bạn có bất kỳ câu hỏi nào về quy trình tuyển dụng hoặc cần hỗ trợ thêm thông tin, vui lòng liên hệ với chúng tôi qua email hr@vinamilk.com.vn.'
            : 'If you have any questions about the recruitment process or need additional information, please feel free to contact us at hr@vinamilk.com.vn.'}
        </div>

        <!-- Closing Message -->
        <div class="closing-message">
          <p class="closing-text">
            ${isVietnamese 
              ? 'Chúc bạn may mắn và chúng tôi mong được gặp bạn sớm!' 
              : 'Best of luck, and we look forward to potentially welcoming you to our team!'}
          </p>
        </div>
      </div>

      <!-- Divider -->
      <hr class="divider">

      <!-- Footer -->
      <div class="footer">
        <div class="company-info">
          <div class="company-name">Vietnam Dairy Products Joint Stock Company</div>
          <div class="contact-info">
            <strong>Email:</strong> hr@vinamilk.com.vn
          </div>
          <div class="contact-info">
            <strong>Website:</strong> 
            <a href="https://vinamilk.com.vn" class="website-link">vinamilk.com.vn</a>
          </div>
          <div class="contact-info">
            <strong>${isVietnamese ? 'Địa chỉ:' : 'Address:'}</strong> 
            ${isVietnamese 
              ? '10 Tân Trào, P. Tân Phú, Q.7, TP. Hồ Chí Minh'
              : '10 Tan Trao Street, Tan Phu Ward, District 7, Ho Chi Minh City'}
          </div>
        </div>
        
        <div class="footer-note">
          ${isVietnamese 
            ? 'Email này được gửi tự động. Vui lòng không trả lời trực tiếp email này.'
            : 'This is an automated email. Please do not reply directly to this message.'}
        </div>
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