using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Turnos.Core.Entities;
using Turnos.Core.Interfaces;
using Turnos.Services.Implementations;
using Moq;
using Xunit;

public class ScheduleManagementTests
{
    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnEmpty_WhenWorksWeekendsIsFalse_AndDayIsSunday()
    {
        // Arrange
        var mockRepo = new Mock<IAppointmentRepository>();
        var service = new AppointmentService(mockRepo.Object);
        var profId = Guid.NewGuid();
        var sunday = new DateTime(2026, 3, 22); // Sunday

        mockRepo.Setup(r => r.GetProfessionalAsync(profId))
            .ReturnsAsync(new Professional { UserId = profId, WorksWeekends = false });

        // Act
        var slots = await service.GetAvailableSlotsAsync(profId, sunday);

        // Assert
        Assert.Empty(slots);
    }

    [Fact]
    public async Task GetAvailableSlotsAsync_ShouldReturnSlots_WhenWorksWeekendsIsFalse_AndDayIsMonday()
    {
        // Arrange
        var mockRepo = new Mock<IAppointmentRepository>();
        var service = new AppointmentService(mockRepo.Object);
        var profId = Guid.NewGuid();
        var monday = new DateTime(2026, 3, 23); // Monday

        mockRepo.Setup(r => r.GetProfessionalAsync(profId))
            .ReturnsAsync(new Professional { UserId = profId, WorksWeekends = false });
        mockRepo.Setup(r => r.GetOccupiedTimeSlots(profId, It.IsAny<DateTime>()))
            .ReturnsAsync(new List<TimeSpan>());

        // Act
        var slots = await service.GetAvailableSlotsAsync(profId, monday);

        // Assert
        Assert.NotEmpty(slots);
    }
}
