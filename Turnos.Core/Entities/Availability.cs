using System;

namespace Turnos.Core.Entities;

public class Availability
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;
    
    // 0=Domingo, 1=Lunes, ...
    public short DayOfWeek { get; set; }
    
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public short SlotDurationMinutes { get; set; } // Ej: 30
}
