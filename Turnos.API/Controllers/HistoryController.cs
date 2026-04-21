using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Turnos.Infrastructure.Data;
using Turnos.Core.Entities;
using Turnos.Core.DTOs;
using System.Security.Claims;

namespace Turnos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HistoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HistoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchPatients([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return Ok(Enumerable.Empty<PatientSearchResponse>());

        var patients = await _context.Patients
            .Where(p => p.FirstName.ToLower().Contains(query.ToLower())
                     || p.LastName.ToLower().Contains(query.ToLower())
                     || p.Dni.Contains(query))
            .Select(p => new PatientSearchResponse
            {
                Id = p.UserId,
                FirstName = p.FirstName,
                LastName = p.LastName,
                Dni = p.Dni,
                Phone = p.Phone
            })
            .ToListAsync();

        return Ok(patients);
    }

    [HttpGet("patient/{id}")]
    public async Task<IActionResult> GetPatientHistory(Guid id)
    {
        var patient = await _context.Patients
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == id);

        if (patient == null) return NotFound("Paciente no encontrado.");

        var notes = await _context.ClinicalNotes
            .Include(n => n.Professional)
            .Where(n => n.PatientId == id)
            .OrderByDescending(n => n.Date)
            .Select(n => new EvolutionResponse
            {
                Id = n.Id,
                Date = n.Date,
                Note = n.Note,
                ProfessionalName = $"{n.Professional.FirstName} {n.Professional.LastName}"
            })
            .ToListAsync();

        return Ok(new PatientHistoryResponse
        {
            PatientId = patient.UserId,
            FirstName = patient.FirstName,
            LastName = patient.LastName,
            Dni = patient.Dni,
            Phone = patient.Phone,
            Email = patient.User.Email,
            Address = patient.Address,
            InsuranceCompany = patient.InsuranceCompany,
            InsuranceNumber = patient.InsuranceNumber,
            DateOfBirth = patient.DateOfBirth,
            Evolutions = notes
        });

    }

    [HttpPost("evolution")]
    public async Task<IActionResult> CreateEvolution([FromBody] CreateEvolutionRequest request)
    {
        // Para este MVP, el frontend envía professionalId, si no viene intentamos obtenerlo del token.
        Guid professionalId;
        if (request.ProfessionalId.HasValue)
        {
            professionalId = request.ProfessionalId.Value;
        }
        else
        {
            var profIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(profIdStr)) return BadRequest("ProfessionalId es requerido.");
            professionalId = Guid.Parse(profIdStr);
        }

        var note = new ClinicalNote
        {
            PatientId = request.PatientId,
            ProfessionalId = professionalId,
            AppointmentId = request.AppointmentId,
            Note = request.Note,
            Date = DateTime.UtcNow
        };

        if (request.AppointmentId.HasValue)
        {
            var appointment = await _context.Appointments.FindAsync(request.AppointmentId.Value);
            if (appointment != null)
            {
                appointment.Status = "COMPLETED";
            }
        }

        _context.ClinicalNotes.Add(note);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Evolución registrada correctamente." });
    }

    [HttpPut("evolution/{id}")]
    public async Task<IActionResult> UpdateEvolution(Guid id, [FromBody] UpdateEvolutionRequest request)
    {
        var evolution = await _context.ClinicalNotes.FindAsync(id);
        if (evolution == null) return NotFound("Evolución no encontrada.");

        evolution.Note = request.Note;
        // Opcionalmente podemos actualizar la fecha de edición si tuviéramos un campo LastModified
        
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Evolución actualizada correctamente." });
    }
}


