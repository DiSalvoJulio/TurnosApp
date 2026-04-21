using System;

namespace Turnos.Core.Entities;

public class Appointment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;
    
    public Guid? PatientId { get; set; }
    public Patient? Patient { get; set; }
    
    public DateTime AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    
    // SCHEDULED, COMPLETED, CANCELLED, BLOCKED
    public string Status { get; set; } = "SCHEDULED"; 
    
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
