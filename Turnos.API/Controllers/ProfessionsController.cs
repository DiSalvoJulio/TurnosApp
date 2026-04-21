using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Turnos.Core.Entities;
using Turnos.Infrastructure.Data;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace Turnos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfessionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ProfessionsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Profession>>> GetProfessions()
    {
        return await _context.Professions.OrderBy(p => p.Name).ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Profession>> CreateProfession([FromBody] Profession dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        var normalizedName = dto.Name.Trim().ToLower();
        var exists = await _context.Professions.AnyAsync(p => p.Name.ToLower() == normalizedName);
        if (exists)
            return BadRequest("Esa especialidad ya existe.");

        var profession = new Profession { Name = dto.Name.Trim() };
        _context.Professions.Add(profession);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProfessions), new { id = profession.Id }, profession);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProfession(Guid id, [FromBody] Profession dto)
    {
        var profession = await _context.Professions.FindAsync(id);
        if (profession == null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Name is required");

        var normalizedName = dto.Name.Trim().ToLower();
        var exists = await _context.Professions.AnyAsync(p => p.Id != id && p.Name.ToLower() == normalizedName);
        if (exists)
            return BadRequest("Esa especialidad ya existe.");

        profession.Name = dto.Name.Trim();
        profession.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<IActionResult> ToggleProfession(Guid id)
    {
        var profession = await _context.Professions.FindAsync(id);
        if (profession == null) return NotFound();

        profession.IsActive = !profession.IsActive;
        await _context.SaveChangesAsync();
        return NoContent();
    }
    
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProfession(Guid id)
    {
        var profession = await _context.Professions.FindAsync(id);
        if (profession == null) return NotFound();

        _context.Professions.Remove(profession);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
