using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Turnos.Core.Entities;
using Turnos.Core.Interfaces;
using Turnos.Infrastructure.Data;

namespace Turnos.Infrastructure.Repositories;

public class AppointmentRepository : IAppointmentRepository
{
    private readonly ApplicationDbContext _context;

    public AppointmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Appointment> AddAsync(Appointment appointment)
    {
        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();
        return appointment;
    }

    public async Task<Appointment?> GetByIdAsync(Guid id)
    {
        return await _context.Appointments.FindAsync(id);
    }

    public async Task UpdateAsync(Appointment appointment)
    {
        _context.Entry(appointment).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByPatientAsync(Guid patientId)
    {
        return await _context.Appointments
            .Include(a => a.Professional)
            .Where(a => a.PatientId == patientId)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetByProfessionalAsync(Guid professionalId)
    {
        return await _context.Appointments
            .Include(a => a.Patient)
            .Where(a => a.ProfessionalId == professionalId)
            .OrderBy(a => a.AppointmentDate)
            .ThenBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetAllAsync()
    {
        return await _context.Appointments
            .Include(a => a.Professional)
            .Include(a => a.Patient)
            .OrderByDescending(a => a.AppointmentDate)
            .ThenByDescending(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<IEnumerable<Appointment>> GetOccupiedAppointmentsAsync(Guid professionalId, DateTime date)
    {
        var targetDate = date.ToUniversalTime().Date;
        return await _context.Appointments
            .Where(a => a.ProfessionalId == professionalId 
                     && a.AppointmentDate == targetDate
                     && (a.Status == "SCHEDULED" || a.Status == "BLOCKED"))
            .ToListAsync();
    }

    public async Task<Professional?> GetProfessionalAsync(Guid id)
    {
        return await _context.Professionals
            .Include(p => p.User)
            .Include(p => p.WorkingHours)
            .FirstOrDefaultAsync(p => p.UserId == id);
    }

    public async Task UpdateProfessionalAsync(Professional prof)
    {
        _context.Entry(prof).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task UpdateProfessionalWorkingHoursAsync(Guid profId, IEnumerable<WorkingHour> newWorkingHours)
    {
        var existing = _context.WorkingHours.Where(w => w.ProfessionalId == profId);
        _context.WorkingHours.RemoveRange(existing);
        await _context.WorkingHours.AddRangeAsync(newWorkingHours);
        await _context.SaveChangesAsync();
    }
}
