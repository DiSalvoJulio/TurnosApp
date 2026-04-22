using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Turnos.Core.DTOs;
using Turnos.Core.Entities;
using Turnos.Core.Interfaces;

namespace Turnos.Services.Implementations;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _repository;

    public AppointmentService(IAppointmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<AppointmentResponse> CreateAppointmentAsync(CreateAppointmentRequest request)
    {
        // Validación: Solo permitir turnos a partir de mañana
        if (request.AppointmentDate <= DateOnly.FromDateTime(DateTime.Today))
        {
            throw new ArgumentException("Los turnos deben solicitarse con al menos un día de anticipación.");
        }

        // VALIDACIÓN DE SOLAPAMIENTO (Prevención de doble reserva/Race Condition)
        var dt = request.AppointmentDate.ToDateTime(TimeOnly.MinValue);
        var occupiedApps = await _repository.GetOccupiedAppointmentsAsync(request.ProfessionalId, dt);
        
        bool isAlreadyTaken = occupiedApps.Any(app => 
            request.StartTime < app.EndTime && request.EndTime > app.StartTime);

        if (isAlreadyTaken)
        {
            throw new InvalidOperationException("El horario seleccionado ya no está disponible. Por favor, elija otro.");
        }

        // Registro del turno
        var appointment = new Appointment
        {
            ProfessionalId = request.ProfessionalId,
            PatientId = request.PatientId,
            AppointmentDate = request.AppointmentDate.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = "SCHEDULED"
        };

        var result = await _repository.AddAsync(appointment);
        return MapToResponse(result);
    }

    public async Task<bool> CancelAppointmentAsync(Guid id)
    {
        var appointment = await _repository.GetByIdAsync(id);
        if (appointment == null || appointment.Status == "CANCELLED") return false;

        appointment.Status = "CANCELLED";
        await _repository.UpdateAsync(appointment);
        return true;
    }

    public async Task<bool> MarkAsRescheduledAsync(Guid id)
    {
        var appointment = await _repository.GetByIdAsync(id);
        if (appointment == null) return false;

        appointment.Status = "RESCHEDULED";
        await _repository.UpdateAsync(appointment);
        return true;
    }

    public async Task<AppointmentResponse> BlockTimeAsync(BlockTimeRequest request)
    {
        var block = new Appointment
        {
            ProfessionalId = request.ProfessionalId,
            PatientId = null,
            AppointmentDate = request.Date.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = "BLOCKED",
            Notes = request.Reason
        };

        var result = await _repository.AddAsync(block);
        return MapToResponse(result);
    }

    public async Task<IEnumerable<AppointmentResponse>> GetPatientAppointmentsAsync(Guid patientId)
    {
        var appointments = await _repository.GetByPatientAsync(patientId);
        return appointments.Select(MapToResponse);
    }

    public async Task<IEnumerable<AppointmentResponse>> GetProfessionalAppointmentsAsync(Guid professionalId)
    {
        var appointments = await _repository.GetByProfessionalAsync(professionalId);
        return appointments.Select(MapToResponse);
    }

    public async Task<IEnumerable<AppointmentResponse>> GetAllAppointmentsAsync()
    {
        var appointments = await _repository.GetAllAsync();
        return appointments.Select(MapToResponse);
    }

    public async Task<IEnumerable<string>> GetAvailableSlotsAsync(Guid professionalId, DateOnly date)
    {
        var dt = date.ToDateTime(TimeOnly.MinValue);
        // 1. Reglas fijas y ajustes de fines de semana
        // Siempre deshabilitar Domingos
        if (dt.DayOfWeek == DayOfWeek.Sunday)
        {
            return Enumerable.Empty<string>();
        }

        var prof = await _repository.GetProfessionalAsync(professionalId);
        if (prof == null) return Enumerable.Empty<string>();

        // Sábado deshabilitado si el profesional lo configuró así
        if (!prof.WorksWeekends && dt.DayOfWeek == DayOfWeek.Saturday)
        {
            return Enumerable.Empty<string>();
        }

        // 2. Generar todos los slots posibles según las horas configuradas
        var potentialSlots = new List<TimeSpan>();
        var duration = TimeSpan.FromMinutes(prof.AppointmentDuration > 0 ? prof.AppointmentDuration : 30);
        
        var workingHoursForDay = prof.WorkingHours?.Where(w => w.DayOfWeek == (int)dt.DayOfWeek).OrderBy(w => w.StartTime).ToList();
        
        if (workingHoursForDay != null && workingHoursForDay.Any())
        {
            foreach (var wh in workingHoursForDay)
            {
                var currentSlot = wh.StartTime;
                while (currentSlot.Add(duration) <= wh.EndTime)
                {
                    potentialSlots.Add(currentSlot);
                    currentSlot = currentSlot.Add(duration);
                }
            }
        }

        // 3. Obtener citas ocupadas o bloqueadas para ese día
        var occupiedApps = await _repository.GetOccupiedAppointmentsAsync(professionalId, dt);

        // 4. Filtrar slots que se solapen con cualquier cita/bloqueo
        var availableSlots = potentialSlots.Where(slotStart => 
        {
            var slotEnd = slotStart.Add(duration);
            
            // Un slot está disponible si NO se solapa con ninguna cita ocupada
            return !occupiedApps.Any(app => 
            {
                // Un traslape ocurre si:
                // (StartA < EndB) y (EndA > StartB)
                return slotStart < app.EndTime && slotEnd > app.StartTime;
            });
        }).Select(s => s.ToString(@"hh\:mm"));
        
        return availableSlots;
    }

    public async Task<Professional?> GetProfessionalAsync(Guid id)
    {
        return await _repository.GetProfessionalAsync(id);
    }

    public async Task UpdateProfessionalSettingsAsync(UpdateProfessionalSettingsRequest request, Guid profId)
    {
        var prof = await _repository.GetProfessionalAsync(profId);
        if (prof != null)
        {
            prof.WorksWeekends = request.WorksWeekends;
            prof.AppointmentDuration = request.AppointmentDuration;
            await _repository.UpdateProfessionalAsync(prof);

            // Actualizar WorkingHours de forma segura
            if (request.WorkingHours != null)
            {
                var newWorkingHours = request.WorkingHours.Select(wh => new WorkingHour 
                { 
                    ProfessionalId = profId, 
                    DayOfWeek = wh.DayOfWeek, 
                    StartTime = wh.StartTime, 
                    EndTime = wh.EndTime 
                }).ToList();
                
                await _repository.UpdateProfessionalWorkingHoursAsync(profId, newWorkingHours);
            }
        }
    }

    private AppointmentResponse MapToResponse(Appointment a)
    {
        return new AppointmentResponse
        {
            Id = a.Id,
            ProfessionalId = a.ProfessionalId,
            PatientId = a.PatientId,
            AppointmentDate = DateOnly.FromDateTime(a.AppointmentDate),
            StartTime = a.StartTime,
            EndTime = a.EndTime,
            Status = a.Status,
            ProfessionalName = a.Professional != null ? $"{a.Professional.FirstName} {a.Professional.LastName}" : string.Empty,
            ProfessionalSpecialty = a.Professional?.Specialty ?? string.Empty,
            PatientName = a.Patient != null ? $"{a.Patient.FirstName} {a.Patient.LastName}" : (a.Status == "BLOCKED" ? "Horario Bloqueado" : string.Empty)
        };
    }
}
