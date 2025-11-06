/**
 * Email Utility Functions
 * Common utilities for email operations
 */

export class EmailUtils {
  /**
   * Validate email address format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize recipient name for email headers
   */
  static sanitizeRecipientName(name: string): string {
    return name.replace(/[<>]/g, '').trim();
  }

  /**
   * Generate a random OTP code
   */
  static generateOTP(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  /**
   * Format email subject with emoji and branding
   */
  static formatSubject(emoji: string, text: string, brandName: string = 'Yersi'): string {
    return `${emoji} ${text} - ${brandName}`;
  }

  /**
   * Extract domain from email address
   */
  static extractDomain(email: string): string {
    return email.split('@')[1] || '';
  }

  /**
   * Check if email is from a common provider
   */
  static isCommonEmailProvider(email: string): boolean {
    const commonProviders = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'aol.com'
    ];
    const domain = this.extractDomain(email).toLowerCase();
    return commonProviders.includes(domain);
  }

  /**
   * Mask email address for logging (privacy)
   */
  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : localPart;
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Calculate estimated email delivery time based on provider
   */
  static getEstimatedDeliveryTime(email: string): string {
    const domain = this.extractDomain(email).toLowerCase();
    
    if (this.isCommonEmailProvider(email)) {
      return 'within 1-2 minutes';
    }
    
    // Corporate or less common providers might take longer
    return 'within 5-10 minutes';
  }

  /**
   * Validate and format recipient data
   */
  static validateRecipient(email: string, name?: string): { email: string; name: string } {
    if (!this.isValidEmail(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }

    const sanitizedName = name ? this.sanitizeRecipientName(name) : 'Valued Customer';
    
    return {
      email: email.toLowerCase().trim(),
      name: sanitizedName
    };
  }
}