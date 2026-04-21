using System;
using System.Collections.Generic;

namespace Turnos.Core.DTOs;

public class PatientSearchResponse
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class EvolutionResponse
{
    public Guid Id { get; set; }
    public DateTime Date { get; set; }
    public string Note { get; set; } = string.Empty;
    public string ProfessionalName { get; set; } = string.Empty;
}

public class PatientHistoryResponse
{
    public Guid PatientId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Dni { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string InsuranceCompany { get; set; } = string.Empty;
    public string InsuranceNumber { get; set; } = string.Empty;
    public DateTime DateOfBirth { get; set; }
    public List<EvolutionResponse> Evolutions { get; set; } = new();

}

public class CreateEvolutionRequest
{
    public Guid PatientId { get; set; }
    public Guid? ProfessionalId { get; set; }
    public Guid? AppointmentId { get; set; }
    public string Note { get; set; } = string.Empty;
}

public class UpdateEvolutionRequest
{
    public string Note { get; set; } = string.Empty;
}

