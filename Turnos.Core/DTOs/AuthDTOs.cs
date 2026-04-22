using System;
using System.ComponentModel.DataAnnotations;

namespace Turnos.Core.DTOs;

public class LoginRequest
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "La contraseña es obligatoria")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public Guid Id { get; set; }
    public Guid? ProfileId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

public class ForgotPasswordRequest
{
    [Required(ErrorMessage = "El email es obligatorio")]
    [EmailAddress(ErrorMessage = "El formato del email no es válido")]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
