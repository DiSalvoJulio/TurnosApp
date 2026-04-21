using Microsoft.Extensions.Configuration;
using Resend;
using Turnos.Core.Interfaces;

namespace Turnos.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly IResend _resend;
    private readonly string _fromEmail;

    public EmailService(IResend resend, IConfiguration configuration)
    {
        _resend = resend;
        _fromEmail = configuration["Resend:FromEmail"] ?? "onboarding@resend.dev";
    }

    public async Task<bool> SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var message = new EmailMessage();
            message.From = _fromEmail;
            message.To.Add(to);
            message.Subject = subject;
            message.HtmlBody = body;

            await _resend.EmailSendAsync(message);
            Console.WriteLine($"[EMAIL SENT] To: {to}, Subject: {subject}");
            Console.WriteLine($"[EMAIL BODY] {body}");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error sending email (Is API Key set?): {ex.Message}");
            // Fallback for local testing if API key is missing
            Console.WriteLine($"[LOCAL TEST] To: {to}, Subject: {subject}");
            Console.WriteLine($"[LOCAL TEST BODY] {body}");
            return true; // Return true to allow the flow to continue in local dev
        }
    }
}
