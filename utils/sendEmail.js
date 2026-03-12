const sendBrevoEmail = async (to, subject, htmlContent, textContent) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: 'Terna News',
                email: 'shedgemayank0@gmail.com' // Your verified Brevo sender
            },
            to: [{ email: to }],
            subject: subject,
            htmlContent: htmlContent || `<p>${textContent}</p>`,
            textContent: textContent
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Brevo API Error: ${JSON.stringify(error)}`);
    }

    return await response.json();
};

const sendEmail = async (options) => {
    try {
        await sendBrevoEmail(
            options.email,
            options.subject,
            options.html || null,
            options.message || options.text
        );
        console.log(`Email sent to ${options.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email could not be sent.');
    }
};

const sendWelcomeEmail = async (userEmail, userName) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
          <div style="text-align: center; border-bottom: 2px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #1976d2; margin: 0; font-size: 32px;">📰 Terna News</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Stay Informed, Stay Ahead</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 15px;">Welcome ${userName}! 🎉</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for joining Terna News. You're now part of our community of informed readers.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">📬 What You'll Get:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Breaking news updates</li>
              <li>Weekly newsletter digest</li>
              <li>Campus events coverage</li>
              <li>Exclusive articles</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://ternanews.com'}" 
               style="background-color: #1976d2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Explore Latest News
            </a>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Terna Engineering College | Nerul, Navi Mumbai</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendEmail({
        email: userEmail,
        subject: 'Welcome to Terna News! 📰',
        html: htmlContent
    });
};

const sendNewsletterEmail = async (userEmail, userName, articles) => {
    const articlesHtml = articles.map(article => `
      <div style="border-bottom: 1px solid #eee; padding: 20px 0;">
        ${article.imageUrl ? `
          <img src="${article.imageUrl}" alt="${article.title}" 
               style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 15px;">
        ` : ''}
        <h3 style="color: #333; margin: 0 0 10px 0;">
          <a href="${process.env.FRONTEND_URL}/articles/${article._id}" 
             style="color: #1976d2; text-decoration: none;">
            ${article.title}
          </a>
        </h3>
        <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
          ${article.category || 'News'} | ${new Date(article.createdAt).toLocaleDateString()}
        </p>
        <p style="color: #555; line-height: 1.6; margin: 0 0 15px 0;">
          ${article.excerpt || article.content?.substring(0, 150) || ''}...
        </p>
        <a href="${process.env.FRONTEND_URL}/articles/${article._id}" 
           style="color: #1976d2; text-decoration: none; font-weight: bold;">
          Read More →
        </a>
      </div>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">📰 Terna News Weekly</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your Weekly News Digest</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="color: #555; font-size: 16px; margin-bottom: 25px;">
              Hi ${userName}, here are this week's top stories:
            </p>
            
            ${articlesHtml}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                 View All Articles
              </a>
            </div>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
            <p>Terna Engineering College | Nerul, Navi Mumbai</p>
            <p style="margin: 10px 0;">
              <a href="#" style="color: #999; text-decoration: none;">Unsubscribe</a> | 
              <a href="#" style="color: #999; text-decoration: none;">Preferences</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendEmail({
        email: userEmail,
        subject: `📰 Terna News Weekly - ${new Date().toLocaleDateString()}`,
        html: htmlContent
    });
};

const sendNewArticleEmail = async (userEmail, userName, article) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1976d2; margin: 0;">📰 Terna News</h1>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 8px 15px; border-radius: 20px; display: inline-block; margin-bottom: 15px;">
            <span style="color: #1976d2; font-size: 12px; font-weight: bold;">NEW ARTICLE</span>
          </div>
          
          ${article.imageUrl ? `
            <img src="${article.imageUrl}" alt="${article.title}" 
                 style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
          ` : ''}
          
          <h2 style="color: #333; margin: 0 0 15px 0; font-size: 24px;">
            ${article.title}
          </h2>
          
          <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
            ${article.category || 'News'} | ${article.author || 'Terna News Team'} | 
            ${new Date(article.createdAt).toLocaleDateString()}
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
            ${article.excerpt || article.content?.substring(0, 200) || ''}...
          </p>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/articles/${article._id}" 
               style="background-color: #1976d2; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Read Full Article
            </a>
          </div>
          
          <div style="text-align: center; font-size: 12px; color: #999; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p>Terna Engineering College</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return sendEmail({
        email: userEmail,
        subject: `📰 New: ${article.title}`,
        html: htmlContent
    });
};

const sendVerificationEmail = async (userEmail, verificationToken) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
    
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <h1 style="color: #1976d2; text-align: center;">📰 Terna News</h1>
        <h2 style="color: #333;">Verify Your Email</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Please click the button below to verify your email address and activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
             Verify Email
          </a>
        </div>
        <p style="color: #999; font-size: 14px;">
          If you did not create an account, you can safely ignore this email.
        </p>
      </div>
    `;

    return sendEmail({
        email: userEmail,
        subject: 'Verify Your Terna News Account',
        html: htmlContent
    });
};

const sendPasswordResetEmail = async (userEmail, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; font-family: Arial, sans-serif;">
        <h1 style="color: #1976d2; text-align: center;">📰 Terna News</h1>
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.6;">
          Click the button below to reset your password. This link will expire in 15 minutes.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #f57c00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
             Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 14px;">
          If you did not request a password reset, please ignore this email.
        </p>
      </div>
    `;

    return sendEmail({
        email: userEmail,
        subject: 'Password Reset - Terna News',
        html: htmlContent
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendNewsletterEmail,
    sendNewArticleEmail,
    sendVerificationEmail,
    sendPasswordResetEmail
};