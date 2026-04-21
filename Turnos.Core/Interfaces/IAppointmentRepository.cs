using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Turnos.Core.Entities;

namespace Turnos.Core.Interfaces;

public interface IAppointmentRepository
{
    Task<Appointment> AddAsync(Appointment appointment);
    Task<Appointment?> GetByIdAsync(Guid id);
    Task UpdateAsync(Appointment appointment);
    Task<IEnumerable<Appointment>> GetByPatientAsync(Guid patientId);
    Task<IEnumerable<Appointment>> GetByProfessionalAsync(Guid professionalId);
    Task<IEnumerable<Appointment>> GetAllAsync();
    Task<IEnumerable<Appointment>> GetOccupiedAppointmentsAsync(Guid professionalId, DateTime date);
    Task<Professional?> GetProfessionalAsync(Guid id);
    Task UpdateProfessionalAsync(Professional prof);
    Task UpdateProfessionalWorkingHoursAsync(Guid profId, IEnumerable<WorkingHour> newWorkingHours);
}
