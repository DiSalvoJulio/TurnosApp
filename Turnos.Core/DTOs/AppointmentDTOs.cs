using System;

namespace Turnos.Core.DTOs;

public class CreateAppointmentRequest
{
    public Guid ProfessionalId { get; set; }
    public Guid PatientId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}

public class BlockTimeRequest
{
    public Guid ProfessionalId { get; set; }
    public DateOnly Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Reason { get; set; } = "Bloqueado por el profesional";
}

public class AppointmentResponse
{
    public Guid Id { get; set; }
    public Guid ProfessionalId { get; set; }
    public Guid? PatientId { get; set; }
    public DateOnly AppointmentDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ProfessionalName { get; set; } = string.Empty;
    public string? PatientName { get; set; }
}

public class UpdateProfessionalSettingsRequest
{
    public bool WorksWeekends { get; set; }
    public int AppointmentDuration { get; set; }
    public System.Collections.Generic.List<WorkingHourDto>? WorkingHours { get; set; }
}

public class WorkingHourDto
{
    public int DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}
