using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Turnos.Infrastructure.Data;
using System.Security.Claims;

namespace Turnos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UsersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("professionals")]
    public async Task<IActionResult> GetProfessionals()
    {
        var profs = await _context.Professionals
            .Include(p => p.User)
            .Where(p => p.User.IsActive)
            .Select(p => new
            {
                Id = p.UserId,
                p.FirstName,
                p.LastName,
                p.Specialty,
                p.AppointmentDuration
            })
            .ToListAsync();

        return Ok(profs);
    }

    [HttpGet("admin/professionals")]
    public async Task<IActionResult> GetAdminProfessionals()
    {
        var professionals = await _context.Professionals
            .Include(p => p.User)
            .Select(p => new
            {
                Id = p.UserId,
                p.FirstName,
                p.LastName,
                p.Dni,
                p.Address,
                p.Specialty,
                p.Phone,
                p.DateOfBirth,
                Email = p.User.Email,
                p.User.IsActive

            })
            .ToListAsync();
        return Ok(professionals);
    }

    [HttpGet("admin/patients")]
    public async Task<IActionResult> GetAdminPatients()
    {
        var patients = await _context.Patients
            .Include(p => p.User)
            .Select(p => new
            {
                Id = p.UserId,
                p.FirstName,
                p.LastName,
                p.Dni,
                p.Address,
                p.Phone,
                p.InsuranceCompany,
                p.InsuranceNumber,
                p.DateOfBirth,
                Email = p.User.Email,
                p.User.IsActive

            })
            .ToListAsync();
        return Ok(patients);
    }

    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Role,
                u.IsActive,
                u.CreatedAt
            })
            .ToListAsync();
        return Ok(users);
    }

    [HttpGet("patient/{id}/profile")]
    public async Task<IActionResult> GetPatientProfile(Guid id)
    {
        var patient = await _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id);

        if (patient == null) return NotFound();

        return Ok(new
        {
            patient.UserId,
            patient.FirstName,
            patient.LastName,
            patient.Dni,
            patient.Address,
            patient.Phone,
            patient.InsuranceCompany,
            patient.InsuranceNumber,
            patient.DateOfBirth,
            patient.User.Email,
            Password = patient.User.PasswordHash
        });

    }

    [HttpPut("patient/{id}/profile")]
    public async Task<IActionResult> UpdatePatientProfile(Guid id, [FromBody] UpdateProfileRequest request)
    {
        var patient = await _context.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id);
        if (patient == null) return NotFound();

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = userRole == "ADMIN";

        patient.FirstName = request.FirstName;
        patient.LastName = request.LastName;
        patient.Address = request.Address;
        patient.Phone = request.Phone;
        patient.InsuranceCompany = request.InsuranceCompany;
        patient.InsuranceNumber = request.InsuranceNumber;
        
        if (request.DateOfBirth.HasValue)
        {
            patient.DateOfBirth = request.DateOfBirth.Value;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            patient.User.PasswordHash = request.Password; // MVP: plain text as in current setup
        }

        if (isAdmin)
        {
            patient.Dni = request.Dni;
            patient.User.Email = request.Email;
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Perfil actualizado." });
    }

    [HttpPatch("patient/{id}/status")]
    public async Task<IActionResult> UpdatePatientStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var patient = await _context.Patients.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id);
        if (patient == null) return NotFound();

        patient.User.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Estado actualizado." });
    }

    [HttpGet("professional/{professionalId}/patients")]
    public async Task<IActionResult> GetProfessionalPatients(Guid professionalId)
    {
        var appointments = await _context.Appointments
            .Where(a => a.ProfessionalId == professionalId && a.PatientId != null)
            .Include(a => a.Patient)
            .ThenInclude(p => p.User)
            .ToListAsync();

        var patients = appointments
            .Where(a => a.Patient != null)
            .Select(a => a.Patient!)
            .GroupBy(p => p.UserId)
            .Select(g => g.First())
            .Select(p => new
            {
                Id = p.UserId,
                p.FirstName,
                p.LastName,
                p.Dni,
                p.Address,
                p.Phone,
                p.InsuranceCompany,
                p.InsuranceNumber,
                p.DateOfBirth,
                Email = p.User.Email,
                IsActive = p.User.IsActive

            })
            .ToList();

        return Ok(patients);
    }

    [HttpGet("professional/{id}/profile")]
    public async Task<IActionResult> GetProfessionalProfile(Guid id)
    {
        var prof = await _context.Professionals
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id);

        if (prof == null) return NotFound();

        return Ok(new
        {
            prof.UserId,
            prof.FirstName,
            prof.LastName,
            prof.Dni,
            prof.Address,
            prof.Specialty,
            prof.Phone,
            prof.AppointmentDuration,
            prof.DateOfBirth,
            prof.User.Email,
            Password = prof.User.PasswordHash
        });

    }

    [HttpPut("professional/{id}/profile")]
    public async Task<IActionResult> UpdateProfessionalProfile(Guid id, [FromBody] UpdateProfessionalProfileRequest request)
    {
        var prof = await _context.Professionals.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id);
        if (prof == null) return NotFound();

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        bool isAdmin = userRole == "ADMIN";

        prof.FirstName = request.FirstName;
        prof.LastName = request.LastName;
        prof.Address = request.Address;
        prof.Phone = request.Phone;
        prof.DateOfBirth = request.DateOfBirth;

        if (!string.IsNullOrEmpty(request.Password))
        {
            prof.User.PasswordHash = request.Password; // MVP: plain text
        }

        if (isAdmin)
        {
            prof.Dni = request.Dni;
            prof.Specialty = request.Specialty;
            prof.User.Email = request.Email;
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Perfil actualizado." });
    }

    [HttpPatch("professional/{id}/status")]
    public async Task<IActionResult> UpdateProfessionalStatus(Guid id, [FromBody] UpdateStatusRequest request)
    {
        var prof = await _context.Professionals.Include(p => p.User).FirstOrDefaultAsync(p => p.UserId == id);
        if (prof == null) return NotFound();

        prof.User.IsActive = request.IsActive;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Estado actualizado." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Usuario eliminado permanentemente." });
    }
}

public class UpdateProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string InsuranceCompany { get; set; } = string.Empty;
    public string InsuranceNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string? Password { get; set; }
}

public class UpdateProfessionalProfileRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public string? Password { get; set; }
}

public class UpdateStatusRequest
{
    public bool IsActive { get; set; }
}
