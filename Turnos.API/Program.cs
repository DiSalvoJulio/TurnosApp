using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Turnos.Infrastructure.Data;
using Turnos.Core.Interfaces;
using Turnos.Services.Implementations;
using Turnos.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using Resend;

var builder = WebApplication.CreateBuilder(args);

// Fix for Npgsql DateTimeKind issue
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// =======================
// 🔹 DATABASE
// =======================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("Connection string no configurada");
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// =======================
// 🔹 JWT CONFIG (VALIDADO)
// =======================
var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrEmpty(jwtKey))
    throw new Exception("JWT Key no configurada");

if (string.IsNullOrEmpty(jwtIssuer))
    throw new Exception("JWT Issuer no configurado");

if (string.IsNullOrEmpty(jwtAudience))
    throw new Exception("JWT Audience no configurado");

var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));

// =======================
// 🔹 AUTHENTICATION
// =======================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = signingKey,
        ClockSkew = TimeSpan.FromMinutes(2)
    };
});

// =======================
// 🔒 AUTHORIZATION GLOBAL
// =======================
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// =======================
// 🔹 DEPENDENCY INJECTION
// =======================
builder.Services.AddScoped<IAppointmentRepository, AppointmentRepository>();
builder.Services.AddScoped<IAppointmentService, AppointmentService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// =======================
// 🔹 RESEND
// =======================
builder.Services.AddOptions();
builder.Services.AddHttpClient<ResendClient>();
builder.Services.Configure<ResendClientOptions>(options =>
{
    options.ApiToken = builder.Configuration["Resend:ApiKey"] ?? "";
});
builder.Services.AddTransient<IResend, ResendClient>();

// =======================
// 🔹 CORS
// =======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =======================
// 🔹 CONTROLLERS & SWAGGER
// =======================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// =======================
// 🔹 MIDDLEWARE
// =======================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Seeder
try
{
    await Turnos.Infrastructure.Data.DbSeeder.SeedAsync(app.Services);
}
catch (Exception ex)
{
    Console.WriteLine("Error seeding database: " + ex.Message);
}

app.UseStaticFiles();
app.UseCors("AllowReactApp");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();