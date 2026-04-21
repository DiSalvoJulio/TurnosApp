using System.Threading.Tasks;

namespace Turnos.Core.Interfaces;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string to, string subject, string body);
}
