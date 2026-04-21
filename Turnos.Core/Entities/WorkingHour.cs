using System;

namespace Turnos.Core.Entities;

public class WorkingHour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProfessionalId { get; set; }
    public Professional Professional { get; set; } = null!;
    
    public int DayOfWeek { get; set; } // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
