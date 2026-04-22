using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using Xunit;
using FluentAssertions;
using Turnos.Core.DTOs;
using Turnos.Core.Entities;
using Turnos.Core.Interfaces;
using Turnos.Services.Implementations;

namespace Turnos.Tests;

public class AppointmentServiceTests
{
    private readonly Mock<IAppointmentRepository> _repositoryMock;
    private readonly AppointmentService _service;

    public AppointmentServiceTests()
    {
        _repositoryMock = new Mock<IAppointmentRepository>();
        _service = new AppointmentService(_repositoryMock.Object);
    }

    [Fact]
    public async Task CreateAppointmentAsync_ShouldThrowException_WhenDateIsToday()
    {
        // Arrange
        var request = new CreateAppointmentRequest
        {
            ProfessionalId = Guid.NewGuid(),
            PatientId = Guid.NewGuid(),
            AppointmentDate = DateOnly.FromDateTime(DateTime.Today),
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(10, 30, 0)
        };

        // Act
        var act = async () => await _service.CreateAppointmentAsync(request);

        // Assert
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("Los turnos deben solicitarse con al menos un día de anticipación.");
    }

    [Fact]
    public async Task CreateAppointmentAsync_ShouldSucceed_WhenDateIsTomorrow()
    {
        // Arrange
        var tomorrow = DateOnly.FromDateTime(DateTime.Today.AddDays(1));
        var request = new CreateAppointmentRequest
        {
            ProfessionalId = Guid.NewGuid(),
            PatientId = Guid.NewGuid(),
            AppointmentDate = tomorrow,
            StartTime = new TimeSpan(10, 0, 0),
            EndTime = new TimeSpan(10, 30, 0)
        };

        _repositoryMock.Setup(r => r.AddAsync(It.IsAny<Appointment>()))
            .ReturnsAsync((Appointment a) => {
                a.Id = Guid.NewGuid();
                return a;
            });

        // Act
        var result = await _service.CreateAppointmentAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.AppointmentDate.Should().Be(tomorrow);
        result.Status.Should().Be("SCHEDULED");
        _repositoryMock.Verify(r => r.AddAsync(It.IsAny<Appointment>()), Times.Once);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnEmpty_WhenSunday()
    {
        // Arrange
        var nextSunday = DateTime.Today.AddDays(7 - (int)DateTime.Today.DayOfWeek);
        var date = DateOnly.FromDateTime(nextSunday);
        var profId = Guid.NewGuid();

        // Act
        var result = await _service.GetAvailableSlotsAsync(profId, date);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnEmpty_WhenSaturdayAndProfessionalDoesNotWorkWeekends()
    {
        // Arrange
        var Saturday = new DateOnly(2026, 5, 2); // Es Sábado
        var profId = Guid.NewGuid();
        var prof = new Professional
        {
            UserId = profId,
            WorksWeekends = false, // No trabaja sábados
            AppointmentDuration = 30
        };

        _repositoryMock.Setup(r => r.GetProfessionalAsync(profId)).ReturnsAsync(prof);

        // Act
        var result = await _service.GetAvailableSlotsAsync(profId, Saturday);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnSlots_WhenSaturdayAndProfessionalWorksWeekends()
    {
        // Arrange
        var Saturday = new DateOnly(2026, 5, 9); // Sábado
        var profId = Guid.NewGuid();
        var prof = new Professional
        {
            UserId = profId,
            WorksWeekends = true,
            AppointmentDuration = 30,
            WorkingHours = new List<WorkingHour>
            {
                new WorkingHour { DayOfWeek = 6, StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(10, 0, 0) }
            }
        };

        _repositoryMock.Setup(r => r.GetProfessionalAsync(profId)).ReturnsAsync(prof);
        _repositoryMock.Setup(r => r.GetOccupiedAppointmentsAsync(profId, It.IsAny<DateTime>())).ReturnsAsync(new List<Appointment>());

        // Act
        var result = await _service.GetAvailableSlotsAsync(profId, Saturday);

        // Assert
        result.Should().HaveCount(2); // 09:00, 09:30
        result.Should().Contain("09:00");
        result.Should().Contain("09:30");
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldFilterOccupiedSlots()
    {
        // Arrange
        var Monday = new DateOnly(2026, 5, 4); // Es lunes
        var profId = Guid.NewGuid();
        var prof = new Professional
        {
            UserId = profId,
            AppointmentDuration = 30,
            WorkingHours = new List<WorkingHour>
            {
                new WorkingHour { DayOfWeek = 1, StartTime = new TimeSpan(9, 0, 0), EndTime = new TimeSpan(10, 0, 0) }
            }
        };

        var occupied = new List<Appointment>
        {
            new Appointment 
            { 
                StartTime = new TimeSpan(9, 0, 0), 
                EndTime = new TimeSpan(9, 30, 0),
                Status = "SCHEDULED"
            }
        };

        _repositoryMock.Setup(r => r.GetProfessionalAsync(profId)).ReturnsAsync(prof);
        _repositoryMock.Setup(r => r.GetOccupiedAppointmentsAsync(profId, It.IsAny<DateTime>())).ReturnsAsync(occupied);

        // Act
        var result = await _service.GetAvailableSlotsAsync(profId, Monday);

        // Assert
        result.Should().HaveCount(1);
        result.First().Should().Be("09:30");
    }
}
