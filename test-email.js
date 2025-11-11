const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function testEmailService() {
    try {
        console.log('🚀 Starting email service test...');
        
        const app = await NestFactory.createApplicationContext(AppModule);
        const brevoEmailService = app.get('BrevoEmailService');
        
        const testEmail = 'patrickkwabenaoduro@gmail.com';
        const testName = 'Patrick Kwabena';
        
        console.log(`📧 Testing welcome email to: ${testEmail}`);
        await brevoEmailService.sendWelcomeEmail(testEmail, testName);
        console.log('✅ Welcome email sent successfully!');
        
        console.log(`📧 Testing OTP email to: ${testEmail}`);
        await brevoEmailService.sendOTPEmail(testEmail, testName, '123456');
        console.log('✅ OTP email sent successfully!');
        
        console.log(`📧 Testing password reset email to: ${testEmail}`);
        await brevoEmailService.sendForgotPasswordEmail(testEmail, testName, '789012');
        console.log('✅ Password reset email sent successfully!');
        
        await app.close();
        console.log('🎉 All email tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Email test failed:', error.message);
        process.exit(1);
    }
}

testEmailService();
