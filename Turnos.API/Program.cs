using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Turnos.Infrastructure.Data;
using Turnos.Core.Interfaces;
using Turnos.Services.Implementations;
using Turnos.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Resend;

var builder = WebApplication.CreateBuilder(args);

// Fix for Npgsql DateTimeKind issue
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// DbContext configuration
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Dependency Injection
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Resend Configuration
builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(options => 
{
    options.ApiToken = builder.Configuration["Resend:ApiKey"] ?? "";
});
builder.Services.AddTransient<IResend, ResendClient>();

// CORS to allow React Frontend (Vite uses 5173 by default)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Run Seeder
try
{
    await Turnos.Infrastructure.Data.DbSeeder.SeedAsync(app.Services);
}
catch (Exception ex)
{
    Console.WriteLine("Error seeding database: " + ex.Message);
}

app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
app.Run();
