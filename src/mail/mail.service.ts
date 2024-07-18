import { Injectable } from '@nestjs/common';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
@Injectable()
export class MailService {
  private mg: Mailgun;
  constructor(private configService: ConfigService) {
    this.mg = new Mailgun(formData);
  }
  private async readTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'src',
      'mail',
      'templates',
      `${templateName}.template.html`,
    );
    return fs.readFile(templatePath, 'utf-8');
  }

  private async compileTemplate(
    template: string,
    data: Record<string, string>,
  ): Promise<string> {
    return Object.entries(data).reduce((acc, [key, value]) => {
      return acc.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, template);
  }

  async sendEmail(
    to: string,
    subject: string,
    templateName: string,
    templateData: Record<string, string>,
  ): Promise<void> {
    const domain = this.configService.get<string>('MAILGUN_DOMAIN');
    const apiKey = this.configService.get<string>('MAILGUN_API_KEY');
    const client = this.mg.client({ username: 'api', key: apiKey });

    const template = await this.readTemplate(templateName);
    const html = await this.compileTemplate(template, templateData);

    const messageData = {
      from: `Your App <noreply@${domain}>`,
      to: [to],
      subject: subject,
      html: html,
    };
    try {
      const response = await client.messages.create(domain, messageData);
      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verificationLink = `${this.configService.get('APP_URL')}/verify?token=${token}`;
    await this.sendEmail(to, 'Verify Your Email', 'verification-email', {
      verificationLink,
    });
  }
}