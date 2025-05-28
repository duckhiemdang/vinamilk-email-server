import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const usedEmails = new Set();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const { name, email, language, fullname } = req.body;

    if (!name || !email || !language || !fullname) {
      return res.status(400).json({ 
        error: { message: 'Missing required fields' } 
      });
    }

    if (usedEmails.has(email.toLowerCase())) {
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
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0213b0 0%, #3344c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
          ${isVietnamese ? 'XÁC NHẬN ỨNG TUYỂN' : 'APPLICATION CONFIRMED'}
        </h1>
        <p style="color: #f0f8ff; margin: 10px 0 0 0; font-size: 16px;">
          ${isVietnamese ? 'Chương trình Tuyển dụng GTP 2025' : 'GTP 2025 Recruitment Program'}
        </p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 18px; margin-bottom: 20px;">
          ${isVietnamese ? `Chào ${name},` : `Dear ${name},`}
        </p>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          ${isVietnamese 
            ? 'Cảm ơn bạn đã ứng tuyển vào Chương trình Tuyển dụng GTP 2025 của Vinamilk. Chúng tôi đã nhận được hồ sơ ứng tuyển của bạn thành công.'
            : 'Thank you for applying to Vinamilk\'s GTP 2025 Recruitment Program. We have successfully received your application.'
          }
        </p>
        
        <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0213b0;">
          <h3 style="color: #0213b0; margin: 0 0 15px 0; font-size: 18px;">
            ${isVietnamese ? 'Thông tin ứng tuyển:' : 'Application Details:'}
          </h3>
          <p style="margin: 5px 0;"><strong>${isVietnamese ? 'Họ và tên:' : 'Full Name:'}</strong> ${fullname}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 5px 0;"><strong>${isVietnamese ? 'Thời gian nộp:' : 'Submitted:'}</strong> ${new Date().toLocaleDateString(isVietnamese ? 'vi-VN' : 'en-US')}</p>
        </div>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
          <h4 style="color: #856404; margin: 0 0 10px 0;">
            ${isVietnamese ? '🔔 Các bước tiếp theo:' : '🔔 Next Steps:'}
          </h4>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li style="margin: 5px 0;">
              ${isVietnamese 
                ? 'Chúng tôi sẽ xem xét hồ sơ của bạn trong vòng 7-10 ngày làm việc'
                : 'We will review your application within 7-10 business days'
              }
            </li>
            <li style="margin: 5px 0;">
              ${isVietnamese 
                ? 'Nếu phù hợp, chúng tôi sẽ liên hệ với bạn qua email này để thông báo các bước tiếp theo'
                : 'If selected, we will contact you via this email for next steps'
              }
            </li>
          </ul>
        </div>
        
        <p style="font-size: 16px; margin: 20px 0;">
          ${isVietnamese 
            ? 'Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email này.'
            : 'If you have any questions, please feel free to contact us via this email.'
          }
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #0213b0; font-weight: bold; font-size: 18px; margin: 0;">
            ${isVietnamese ? 'Chúc bạn may mắn!' : 'Good luck!'}
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <div style="text-align: center; font-size: 14px; color: #666;">
          <p style="margin: 5px 0;">
            <strong>Vietnam Dairy Products Joint Stock Company (Vinamilk)</strong>
          </p>
          <p style="margin: 5px 0;">
            ${isVietnamese 
              ? 'Email: hr@vinamilk.com.vn | Website: vinamilk.com.vn'
              : 'Email: hr@vinamilk.com.vn | Website: vinamilk.com.vn'
            }
          </p>
        </div>
      </div>
    </body>
    </html>`;

    const result = await resend.emails.send({
      from: 'Vinamilk GTP 2025 <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    usedEmails.add(email.toLowerCase());

    return res.status(200).json({ 
      success: true, 
      messageId: result.data?.id 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({ 
      error: { message: 'Failed to send email' } 
    });
  }
}