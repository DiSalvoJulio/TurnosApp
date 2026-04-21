
using System;
using Turnos.Core.DTOs;
using Turnos.Services.Implementations;
using Moq;
using Turnos.Core.Interfaces;
using Turnos.Core.Entities;
using Xunit;

public class AppointmentServiceTests
{
    [Fact]
    public async Task CreateAppointmentAsync_Today_ThrowsArgumentException()
    {
        // Arrange
        var mockRepo = new Mock<IAppointmentRepository>();
        var service = new AppointmentService(mockRepo.Object);
        var request = new CreateAppointmentRequest
        {
            AppointmentDate = DateTime.Today,
            StartTime = "09:00",
            EndTime = "09:30"
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAppointmentAsync(request));
    }

    [Fact]
    public async Task CreateAppointmentAsync_Tomorrow_Succeeds()
    {
        // Arrange
        var mockRepo = new Mock<IAppointmentRepository>();
        mockRepo.Setup(r => r.AddAsync(It.IsAny<Appointment>())).ReturnsAsync(new Appointment { Id = Guid.NewGuid() });
        var service = new AppointmentService(mockRepo.Object);
        var request = new CreateAppointmentRequest
        {
            AppointmentDate = DateTime.Today.AddDays(1).Date,
            StartTime = "09:00",
            EndTime = "09:30"
        };

        // Act
        var result = await service.CreateAppointmentAsync(request);

        // Assert
        Assert.NotNull(result);
        mockRepo.Verify(r => r.AddAsync(It.IsAny<Appointment>()), Times.Once);
    }
}
