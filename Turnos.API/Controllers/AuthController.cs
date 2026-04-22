using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using System.ComponentModel.DataAnnotations;
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

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.ResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Contraseña actualizada correctamente." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Buscar por Email primero
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        // Si no se encuentra por email, buscar por DNI
        if (user == null)
        {
            var patient = await _context.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Dni == request.Email);

            if (patient != null) user = patient.User;
        }

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
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

        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.Id}:{user.Role}"));

        return Ok(new AuthResponse
        {
            Token = token,
            Id = user.Id,
            ProfileId = profileId,
            Role = user.Role,
            FirstName = firstName,
            ProfilePictureUrl = user.ProfilePictureUrl
        });
    }

    [HttpPost("register/patient")]
    public async Task<IActionResult> RegisterPatient([FromBody] RegisterPatientRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("El email ya está registrado.");

        var user = new User { 
            Email = request.Email, 
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), 
            Role = "PATIENT" 
        };
        var patient = new Patient
        {
            UserId = user.Id,
            User = user,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Dni = request.Dni,
            Address = request.Address,
            DateOfBirth = request.DateOfBirth
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

        var user = new User { 
            Email = request.Email, 
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password), 
            Role = "PROFESSIONAL" 
        };
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
            DateOfBirth = request.DateOfBirth,
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
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", ErrorMessage = "El nombre solo debe contener letras")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", ErrorMessage = "El apellido solo debe contener letras")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El DNI es obligatorio")]
    [StringLength(8, MinimumLength = 7, ErrorMessage = "El DNI debe tener entre 7 y 8 caracteres")]
    [RegularExpression("^[0-9]+$", ErrorMessage = "El DNI solo debe contener números")]
    public string Dni { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    [RegularExpression(@"^[0-9+\-\s]+$", ErrorMessage = "El formato del teléfono no es válido")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
    public DateTime DateOfBirth { get; set; }
}

public class RegisterProfessionalRequest
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", ErrorMessage = "El nombre solo debe contener letras")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El apellido es obligatorio")]
    [RegularExpression(@"^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$", ErrorMessage = "El apellido solo debe contener letras")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "El DNI es obligatorio")]
    [StringLength(8, MinimumLength = 7, ErrorMessage = "El DNI debe tener entre 7 y 8 caracteres")]
    [RegularExpression("^[0-9]+$", ErrorMessage = "El DNI solo debe contener números")]
    public string Dni { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    [Required(ErrorMessage = "La especialidad es obligatoria")]
    public string Specialty { get; set; } = string.Empty;

    [RegularExpression(@"^[0-9+\-\s]+$", ErrorMessage = "El formato del teléfono no es válido")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "La fecha de nacimiento es obligatoria")]
    public DateTime DateOfBirth { get; set; }
    public bool WorksWeekends { get; set; } = true;
}
