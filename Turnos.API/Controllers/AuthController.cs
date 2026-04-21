using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using Turnos.Core.DTOs;
using Turnos.Core.Interfaces;
using Turnos.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Turnos.Core.Entities;
using System.Linq;

namespace Turnos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IEmailService _emailService;

    public AuthController(ApplicationDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
            return Ok(new { Message = "Si el email existe en nuestro sistema, recibirá un correo para restablecer su contraseña." });

        var token = Guid.NewGuid().ToString();
        user.PasswordResetToken = token;
        user.ResetTokenExpiresAt = DateTimeOffset.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        // En MVP usamos localhost:5173 (Vite default)
        var resetLink = $"http://localhost:5173/reset-password?token={token}";
        var body = $@"
            <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
                <h2 style='color: #2563eb;'>Restablecer Contraseña</h2>
                <p>Hola,</p>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Turnos.</p>
                <div style='margin: 30px 0; text-align: center;'>
                    <a href='{resetLink}' style='background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Restablecer Contraseña</a>
                </div>
                <p>Si no solicitaste esto, puedes ignorar este correo.</p>
                <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;' />
                <p style='font-size: 12px; color: #666;'>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style='font-size: 12px; color: #2563eb;'>{resetLink}</p>
            </div>";

        await _emailService.SendEmailAsync(user.Email, "Restablecer Contraseña - Turnos", body);

        return Ok(new { Message = "Si el email existe en nuestro sistema, recibirá un correo para restablecer su contraseña." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token && u.ResetTokenExpiresAt > DateTimeOffset.UtcNow);
        if (user == null)
            return BadRequest(new { Message = "Token inválido o expirado." });

        // En MVP guardamos plano, en real hasheamos
        user.PasswordHash = request.NewPassword;
        user.PasswordResetToken = null;
        user.ResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Contraseña actualizada correctamente." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Validación MVP directa (en un caso real se usa hasheo e Identity)
        // Buscar por Email primero
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email && u.PasswordHash == request.Password);

        // Si no se encuentra por email, buscar por DNI (si es un paciente)
        if (user == null)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Dni == request.Email && p.User.PasswordHash == request.Password);

            if (patient != null) user = patient.User;
        }

        if (user == null)
            return Unauthorized("Credenciales inválidas.");

        Guid? profileId = null;
        string firstName = "";
        if (user.Role == "PATIENT")
        {
            var pat = await _context.Patients.FirstOrDefaultAsync(p => p.UserId == user.Id);
            firstName = pat?.FirstName ?? "";
            profileId = pat?.UserId;
        }
        else if (user.Role == "PROFESSIONAL")
        {
            var prof = await _context.Professionals.FirstOrDefaultAsync(p => p.UserId == user.Id);
            firstName = prof?.FirstName ?? "";
            profileId = prof?.UserId;
        }

        // Token ficticio en MVP para acelerar el desarrollo del front (En prod: JWT real)
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.Id}:{user.Role}"));

        return Ok(new AuthResponse
        {
            Token = token,
            Id = user.Id,
            ProfileId = profileId,
            Role = user.Role,
            FirstName = firstName
        });
    }

    [HttpPost("register/patient")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("El email ya está registrado.");

        if (!string.IsNullOrWhiteSpace(request.Dni) && await _context.Patients.AnyAsync(p => p.Dni == request.Dni))
            return BadRequest("El DNI ya está registrado para otro paciente.");

        var user = new User { Email = request.Email, PasswordHash = request.Password, Role = "PATIENT" };
        var patient = new Patient
        {
            UserId = user.Id,
            User = user,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Dni = request.Dni,
            Address = request.Address,
            DateOfBirth = DateTime.UtcNow // simplificado para MVP
        };

        _context.Users.Add(user);
        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Paciente registrado correctamente" });
    }

    [HttpPost("register/professional")]
    public async Task<IActionResult> RegisterProfessional([FromBody] RegisterProfessionalRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("El email ya está registrado.");

        if (!string.IsNullOrWhiteSpace(request.Dni) && await _context.Professionals.AnyAsync(p => p.Dni == request.Dni))
            return BadRequest("El DNI ya está registrado para otro profesional.");

        var user = new User { Email = request.Email, PasswordHash = request.Password, Role = "PROFESSIONAL" };
        var professional = new Professional
        {
            UserId = user.Id,
            User = user,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Dni = request.Dni,
            Address = request.Address,
            Specialty = request.Specialty,
            Phone = request.Phone,
            WorksWeekends = request.WorksWeekends
        };

        _context.Users.Add(user);
        _context.Professionals.Add(professional);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Profesional registrado correctamente" });
    }

    [HttpGet("specialties")]
    public async Task<IActionResult> GetSpecialties()
    {
        var specialties = await _context.Professionals
            .Select(p => p.Specialty)
            .Where(s => !string.IsNullOrEmpty(s))
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();
        return Ok(specialties);
    }
}

public class RegisterPatientRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class RegisterProfessionalRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool WorksWeekends { get; set; } = true;
}
