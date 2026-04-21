using Microsoft.EntityFrameworkCore;
using Turnos.Core.Entities;

namespace Turnos.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<Professional> Professionals { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Availability> Availabilities { get; set; }
    public DbSet<ClinicalNote> ClinicalNotes { get; set; }
    public DbSet<WorkingHour> WorkingHours { get; set; }
    public DbSet<Profession> Professions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configurar herencia/extensión de User
        modelBuilder.Entity<Patient>().HasKey(p => p.UserId);
        modelBuilder.Entity<Patient>()
            .HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<Patient>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Patient>()
            .HasIndex(p => p.Dni)
            .IsUnique();

        modelBuilder.Entity<Professional>().HasKey(p => p.UserId);
        modelBuilder.Entity<Professional>()
            .HasOne(p => p.User)
            .WithOne()
            .HasForeignKey<Professional>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Índices
        modelBuilder.Entity<Appointment>()
            .Property(a => a.AppointmentDate)
            .HasColumnType("date");

        modelBuilder.Entity<Appointment>()
            .HasIndex(a => new { a.ProfessionalId, a.AppointmentDate });
            
        modelBuilder.Entity<Appointment>()
            .HasIndex(a => a.PatientId);
            
        modelBuilder.Entity<ClinicalNote>()
            .HasIndex(c => c.PatientId);
            
        modelBuilder.Entity<Availability>()
            .HasIndex(a => a.ProfessionalId);

        modelBuilder.Entity<WorkingHour>()
            .HasIndex(w => w.ProfessionalId);
    }
}
