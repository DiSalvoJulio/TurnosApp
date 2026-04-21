using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Turnos.Core.DTOs;
using Turnos.Core.Entities;

namespace Turnos.Core.Interfaces;

public interface IAppointmentService
{
    Task<AppointmentResponse> CreateAppointmentAsync(CreateAppointmentRequest request);
    Task<bool> CancelAppointmentAsync(Guid id);
    Task<AppointmentResponse> BlockTimeAsync(BlockTimeRequest request);
    Task<IEnumerable<AppointmentResponse>> GetPatientAppointmentsAsync(Guid patientId);
    Task<IEnumerable<AppointmentResponse>> GetProfessionalAppointmentsAsync(Guid professionalId);
    Task<IEnumerable<AppointmentResponse>> GetAllAppointmentsAsync();
    Task<IEnumerable<string>> GetAvailableSlotsAsync(Guid professionalId, DateOnly date);
    Task<Professional?> GetProfessionalAsync(Guid id);
    Task UpdateProfessionalSettingsAsync(UpdateProfessionalSettingsRequest request, Guid profId);
}
