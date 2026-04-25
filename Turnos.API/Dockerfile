# syntax=docker/dockerfile:1

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["Turnos.API/Turnos.API.csproj", "Turnos.API/"]
COPY ["Turnos.Services/Turnos.Services.csproj", "Turnos.Services/"]
COPY ["Turnos.Core/Turnos.Core.csproj", "Turnos.Core/"]
RUN dotnet restore "Turnos.API/Turnos.API.csproj"

# Copy full source and publish
COPY . .
WORKDIR /src/Turnos.API
RUN dotnet publish "Turnos.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
ENTRYPOINT ["dotnet", "Turnos.API.dll"]
