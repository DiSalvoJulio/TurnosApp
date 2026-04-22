using System;

namespace Turnos.Core.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "PATIENT"; // ADMIN, PROFESSIONAL, PATIENT
    public bool IsActive { get; set; } = true;
    public string? PasswordResetToken { get; set; }
    public DateTimeOffset? ResetTokenExpiresAt { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class Professional
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public bool WorksWeekends { get; set; } = true;
    public int AppointmentDuration { get; set; } = 30; // Minutos
    public DateTime DateOfBirth { get; set; }
    public ICollection<WorkingHour> WorkingHours { get; set; } = new List<WorkingHour>();

}

public class Patient
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string InsuranceCompany { get; set; } = string.Empty;
    public string InsuranceNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
}
