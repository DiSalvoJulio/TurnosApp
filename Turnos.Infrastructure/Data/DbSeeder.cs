using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Turnos.Core.Entities;
using Turnos.Infrastructure.Data;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Turnos.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await context.Database.EnsureCreatedAsync();

        // Hack para MVP: Asegurar que la nueva columna existe si la DB ya estaba creada
        try {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Professionals\" ADD COLUMN IF NOT EXISTS \"WorksWeekends\" BOOLEAN DEFAULT TRUE;");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Professionals\" ADD COLUMN IF NOT EXISTS \"Dni\" TEXT DEFAULT '';");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Professionals\" ADD COLUMN IF NOT EXISTS \"Address\" TEXT DEFAULT '';");
            
            // Nuevas columnas para Pacientes
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Patients\" ADD COLUMN IF NOT EXISTS \"InsuranceCompany\" TEXT DEFAULT '';");
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Patients\" ADD COLUMN IF NOT EXISTS \"InsuranceNumber\" TEXT DEFAULT '';");

            // Configuración adicional para Profesionales
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE \"Professionals\" ADD COLUMN IF NOT EXISTS \"AppointmentDuration\" INTEGER DEFAULT 30;");
        } catch { /* Ignorar si falla por el motor de BD */ }
        
        bool changed = false;

        // Seed admin account
        if (!context.Users.Any(u => u.Email == "admin@turnos.com"))
        {
            var adminUser = new User { Email = "admin@turnos.com", PasswordHash = "123", Role = "ADMIN" };
            context.Users.Add(adminUser);
            changed = true;
        }

        // Reemplazo explícito de credenciales solicitado por el usuario
        var oldUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "doctor@turnos.com");
        if (oldUser != null)
        {
            oldUser.Email = "juanperez@turnos.com";
            // Aseguramos que el profesional vinculado se llame Juan Pérez para que coincida con la lógica
            var prof = await context.Professionals.FirstOrDefaultAsync(p => p.UserId == oldUser.Id);
            if (prof != null)
            {
                prof.FirstName = "Juan";
                prof.LastName = "Pérez";
                prof.Specialty = "Osteopatía";
            }
            changed = true;
        }

        var professionalsToSeed = new List<(string Email, string First, string Last, string Specialty, string Phone)>
        {
            ("juanperez@turnos.com", "Juan", "Pérez", "Osteopatía", "11223344"),
            ("odontologia@turnos.com", "Ana", "García", "Odontología", "11223355"),
            ("kinesiologia@turnos.com", "Luis", "Rodríguez", "Kinesiología", "11223366"),
            ("quiropraxia@turnos.com", "Marta", "Sánchez", "Quiropraxia", "11223377")
        };

        // Limpieza de duplicados por nombre y especialidad (prevención de basura de seeders anteriores)
        var allProfs = await context.Professionals.ToListAsync();
        var duplicates = allProfs
            .GroupBy(p => new { p.FirstName, p.LastName, p.Specialty })
            .Where(g => g.Count() > 1)
            .SelectMany(g => g.Skip(1)) // Mantenemos el primero, eliminamos el resto
            .ToList();

        if (duplicates.Any())
        {
            context.Professionals.RemoveRange(duplicates);
            changed = true;
        }

        foreach (var pInfo in professionalsToSeed)
        {
            var existingProf = await context.Professionals
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.User.Email == pInfo.Email);

            if (existingProf != null)
            {
                // Aseguramos que el profesional esté activo y con los datos correctos
                if (!existingProf.User.IsActive || existingProf.Specialty != pInfo.Specialty || existingProf.FirstName != pInfo.First || existingProf.LastName != pInfo.Last)
                {
                    existingProf.User.IsActive = true;
                    existingProf.FirstName = pInfo.First;
                    existingProf.LastName = pInfo.Last;
                    existingProf.Specialty = pInfo.Specialty;
                    changed = true;
                }
            }
            else
            {
                // Si no existe el usuario por email, lo creamos
                var existingUser = await context.Users.FirstOrDefaultAsync(u => u.Email == pInfo.Email);
                if (existingUser == null)
                {
                    var user = new User { Email = pInfo.Email, PasswordHash = "123", Role = "PROFESSIONAL" };
                    var prof = new Professional { 
                        UserId = user.Id, User = user, 
                        FirstName = pInfo.First, LastName = pInfo.Last, 
                        Specialty = pInfo.Specialty, Phone = pInfo.Phone 
                    };
                    context.Users.Add(user);
                    context.Professionals.Add(prof);
                    changed = true;
                }
                else if (existingUser.Role == "PROFESSIONAL")
                {
                    // Si el usuario existe pero no tiene un perfil profesional vinculado (inconsistencia)
                    var prof = new Professional { 
                        UserId = existingUser.Id, User = existingUser, 
                        FirstName = pInfo.First, LastName = pInfo.Last, 
                        Specialty = pInfo.Specialty, Phone = pInfo.Phone 
                    };
                    context.Professionals.Add(prof);
                    existingUser.IsActive = true;
                    changed = true;
                }
            }
        }

        // Seed Patient if not exists
        if (!context.Users.Any(u => u.Email == "paciente@turnos.com"))
        {
            var patUser = new User { Email = "paciente@turnos.com", PasswordHash = "123", Role = "PATIENT" };
            var pat = new Patient { 
                UserId = patUser.Id, User = patUser, 
                FirstName = "María", LastName = "Gómez", Phone = "55667788", 
                Dni = "12345678", Address = "Calle Falsa 123",
                DateOfBirth = new DateTime(1990, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            };
            context.Users.Add(patUser);
            context.Patients.Add(pat);
            changed = true;
        }

        if (changed)
        {
            await context.SaveChangesAsync();
        }
    }
}
