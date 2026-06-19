using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System;
using System.Threading;
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var smtpHost = _configuration["EmailSettings:Host"];
            var smtpPort = int.Parse(_configuration["EmailSettings:Port"]);
            var smtpUser = _configuration["EmailSettings:Username"];
            var smtpPass = _configuration["EmailSettings:Password"];

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            var mailMessage = new MailMessage(smtpUser, to, subject, body)
            {
                IsBodyHtml = true
            };

            await client.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {To}", to);
            throw;
        }
    }
}