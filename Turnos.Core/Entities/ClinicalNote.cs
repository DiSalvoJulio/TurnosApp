using System;

namespace Turnos.Core.Entities;

public class ClinicalNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PatientId { get; set; }
    public Patient Patient { get; set; } = null!;
    
    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;
    
    public Guid? AppointmentId { get; set; }
    public Appointment? Appointment { get; set; }
    
    public string Note { get; set; } = string.Empty;
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
