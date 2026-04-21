using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System;
using Turnos.Core.DTOs;
using Turnos.Core.Interfaces;

namespace Turnos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AppointmentsController : ControllerBase
{
    private readonly IAppointmentService _service;

    public AppointmentsController(IAppointmentService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAppointment([FromBody] CreateAppointmentRequest request)
    {
        var result = await _service.CreateAppointmentAsync(request);
        return CreatedAtAction(nameof(GetPatientAppointments), new { patientId = request.PatientId }, result);
    }

    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelAppointment(Guid id)
    {
        var success = await _service.CancelAppointmentAsync(id);
        if (!success) return NotFound("Turno no encontrado o ya cancelado.");

        return Ok(new { message = "Turno cancelado correctamente." });
    }

    [HttpPost("block")]
    public async Task<IActionResult> BlockTime([FromBody] BlockTimeRequest request)
    {
        var result = await _service.BlockTimeAsync(request);
        return Ok(result);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<IActionResult> GetPatientAppointments(Guid patientId)
    {
        var result = await _service.GetPatientAppointmentsAsync(patientId);
        return Ok(result);
    }

    [HttpGet("professional/{professionalId}")]
    public async Task<IActionResult> GetProfessionalAppointments(Guid professionalId)
    {
        var result = await _service.GetProfessionalAppointmentsAsync(professionalId);
        return Ok(result);
    }

    [HttpGet("all")]
    public async Task<IActionResult> GetAllAppointments()
    {
        var result = await _service.GetAllAppointmentsAsync();
        return Ok(result);
    }

    [HttpGet("available-slots")]
    public async Task<IActionResult> GetAvailableSlots([FromQuery] Guid profId, [FromQuery] DateOnly date)
    {
        var slots = await _service.GetAvailableSlotsAsync(profId, date);
        return Ok(slots);
    }

    [HttpGet("professional/settings/{profId}")]
    public async Task<IActionResult> GetProfessionalSettings(Guid profId)
    {
        var prof = await _service.GetProfessionalAsync(profId);
        if (prof == null) return NotFound();

        var wh = prof.WorkingHours?.Select(w => new WorkingHourDto
        {
            DayOfWeek = w.DayOfWeek,
            StartTime = w.StartTime,
            EndTime = w.EndTime
        }).ToList();

        return Ok(new
        {
            worksWeekends = prof.WorksWeekends,
            appointmentDuration = prof.AppointmentDuration,
            workingHours = wh
        });
    }

    [HttpPatch("professional/settings/{profId}")]
    public async Task<IActionResult> UpdateProfessionalSettings(Guid profId, [FromBody] UpdateProfessionalSettingsRequest request)
    {
        await _service.UpdateProfessionalSettingsAsync(request, profId);
        return Ok(new { message = "Configuración actualizada correctamente." });
    }
}
